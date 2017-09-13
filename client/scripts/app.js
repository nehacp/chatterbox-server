class App {
  constructor() {
    this._rooms = {};
    this._currentRoom = 'lobby';
    this._friends = new Set();
    this.server = 'http://parse.sfm8.hackreactor.com/chatterbox/classes/messages';
    this.init();
  }

  init() {
    this.fetch();
    this._username = new URL(location.href).searchParams.get('username');

    // Add or remove friend
    $('#chats').on('click', '.username', ((el) => {
      this._handleUserClick(el.target.innerText);
    }));

    // Change current room
    $('#roomSelect').change((() => {
      const selected = document.getElementById('roomSelect').value;
      this._currentRoom = selected;
      this._renderMessages();
    }));

    // Create new room
    $('#newRoom').click((() => {
      const val = document.getElementById('message').value;
      if (val === '') {
        alert('Please enter a message first!');
        return;
      }
      const newRoom = prompt('Enter room name');
      this._currentRoom = newRoom;
      this._handleSubmit(val, true);
      document.getElementById('message').value = '';
    }));

    // Send message
    $('#send').unbind().click(((el) =>{
      this._handleSubmit(document.getElementById('message').value);
      document.getElementById('message').value = '';
    }).bind(this));

    $(document).keyup(((e) => {
      if(e.which === 13) {
        const el = document.getElementById('message')
        this._handleSubmit(el.value);
        el.value = document.getElementById('message').defaultValue;
      }
    }));

    const refreshCurrentRoomLoop = () => {
      setTimeout((() => {
        this.fetch(true);
        refreshCurrentRoomLoop();
      }), 5000);
    };
    refreshCurrentRoomLoop();
  }

  send(message, isNewRoom = false) {
    $.ajax({
      url: 'http://parse.sfm8.hackreactor.com/chatterbox/classes/messages',
      type: 'POST',
      data: JSON.stringify(message),
      contentType: 'application/json',
      success: (data) => {
        console.log('chatterbox: Message sent');
        if (isNewRoom) {
          this._reload();
        } else {
          this.fetch(true);
        }
      },
      error: function (data) {
        console.error('chatterbox: Failed to send message', data);
      }
    });
  }

  // isRefresh === true means that only the current room messages need to be updated
  // Otherwise, the entire page is refreshed/reloaded.
  fetch(isRefresh = false) {
    let finalStr = `order=-updatedAt`;
    if (isRefresh) {
      const date = this._rooms[this._currentRoom][0].updatedAt;
      finalStr += `&where={"createdAt":{"$gt":{"__type": "Date", "iso": "${date}"}},"roomname":{"$in":["${this._currentRoom}"]}}`;
    }
    // const that = this;

    $.ajax({
      url: 'http://parse.sfm8.hackreactor.com/chatterbox/classes/messages',
      type: 'GET',
      data: finalStr,
      contentType: 'application/json',
      success: (data) => {
        if (isRefresh) {
          const newChats = this._parseNewData(data.results);
          this._addNewChats(newChats);
          this._updateGlobalObject(newChats);
        } else {
          this._parseData(data.results);
          this._createDropdown();
          this._renderMessages(); // Set initial room to lobby
        }
      },
      error: function (data) {
        console.error('chatterbox: Failed Fetch', data);
      }
    });
  }

  _parseData(array) {
    for (let messageObj of array) {
      this._escapeMessageVals(messageObj);
      const room = messageObj.roomname;
      const name = messageObj.username;

      // Check for null/undefined rooms. Cannot do a truthy check since room/username can be 0
      if (room === undefined || room === null || name === undefined || name === null) {
        continue;
      }
      if (this._rooms[room]) {
        this._rooms[room].push(messageObj);
      } else {
        this._rooms[room] = [messageObj];
      }
    }
  }

  _escapeMessageVals(messageObj) {
    for (let key in messageObj) {
      messageObj[key] = _.escape(messageObj[key]);
    }
  }

  _createDropdown() {
    const dropdown = document.getElementById('roomSelect');
    for (let room in this._rooms) {
      $('#roomSelect').prepend(`<option class="room" value="${room}"> ${room}</option>`);
    }
    dropdown.value = this._currentRoom;
  }

  _renderMessages() {
    $('#chats').empty();
    const messages = this._rooms[_.escape(this._currentRoom)];
    for (let message of messages) {
      const {username, text, updatedAt} = message;
      let readableDate = new Date(updatedAt);
      const options = {
          weekday: "long", year: "numeric", month: "short",
          day: "numeric", hour: "2-digit", minute: "2-digit"
      };
      readableDate = readableDate.toLocaleTimeString("en-us", options);
      $('#chats').append(`<div class="single-chat">
      <span class="username" data-user="${username}"> ${username}</span>: ${text}
      <div class="stamps">${readableDate} <span class="friendTag">&#9733Friends</span>
      </div></div>`);
    }
    this._addFriends();
  }

  _addFriends() {
    this._friends.forEach((user) => {
      const selected = $(`[data-user="${user}"]`);
      selected.addClass('friend');
      selected.next().children().css("display", "inline");
    });
  }

  _parseNewData(array) {
    const result = [];
    if (array.length < 1) { return result; }
    for (let messageObj of array) {
      this._escapeMessageVals(messageObj);
      const name = messageObj.username;
      if (name === undefined || name === null) {
        continue;
      }
      result.push(messageObj);
    }

    return result;
  }

  _addNewChats(array) {
    // Iterate from OLDEST to NEWEST of new chats and PREPEND to #chats
    // This will ensure absolute chat order from oldest to newest
    for (let i = array.length - 1; i >= 0; i--) {
      const username = array[i].username;
      const text = array[i].text;
      const updatedAt = array[i].updatedAt;
      let readableDate = new Date(updatedAt);
      const options = {
          weekday: "long", year: "numeric", month: "short",
          day: "numeric", hour: "2-digit", minute: "2-digit"
      };
      readableDate = readableDate.toLocaleTimeString("en-us", options);
      $('#chats').prepend(`<div class="single-chat">
      <span class="username" data-user="${username}"> ${username}</span>: ${text}
      <div class="stamps">${readableDate} <span class="friendTag">&#9733Friends</span>
      </div></div>`);
    }

    this._addFriends();
  }

  _updateGlobalObject(array) {
    const final = array.concat(this._rooms[this._currentRoom]);
    this._rooms[this._currentRoom] = final;
  }

  _reload() {
    $('#chats').empty();
    $('#roomSelect').empty();
    this._rooms = {};
    this.fetch();
  }

  _handleSubmit(messageText, isNewRoom = false) {
    const message = {};
    message.text = messageText;
    message.username = this._username;
    message.roomname = this._currentRoom;
    this.send(message, isNewRoom);
  }

  _handleUserClick(user) {
    const selected = $(`[data-user="${user}"]`)
    selected.toggleClass('friend');
    selected.next().children().toggle();

    this._friends.has(user) ? this._friends.delete(user) : this._friends.add(user);
  }
}

$(document).ready(function() {
  const app = new App();
});

//NOTE: Uncomment me for testing
//const app = new App();
