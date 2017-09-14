var request = require('request');
var expect = require('chai').expect;

describe('server', function() {
  it('should respond to GET requests for /classes/messages with a 200 status code', function(done) {
    request('http://127.0.0.1:3000/classes/messages', function(error, response, body) {
      expect(response.statusCode).to.equal(200);
      done();
    });
  });

  it('should send back parsable stringified JSON', function(done) {
    request('http://127.0.0.1:3000/classes/messages', function(error, response, body) {
      expect(JSON.parse.bind(this, body)).to.not.throw();
      done();
    });
  });

  it('should send back an object', function(done) {
    request('http://127.0.0.1:3000/classes/messages', function(error, response, body) {
      var parsedBody = JSON.parse(body);
      expect(parsedBody).to.be.an('object');
      done();
    });
  });

  it('should send an object containing a `results` array', function(done) {
    request('http://127.0.0.1:3000/classes/messages', function(error, response, body) {
      var parsedBody = JSON.parse(body);
      expect(parsedBody).to.be.an('object');
      expect(parsedBody.results).to.be.an('array');
      done();
    });
  });

  it('should accept POST requests to /classes/messages', function(done) {
    var requestParams = {method: 'POST',
      uri: 'http://127.0.0.1:3000/classes/messages',
      json: {
        username: 'Jono',
        message: 'Do my bidding!'}
    };

    request(requestParams, function(error, response, body) {
      expect(response.statusCode).to.equal(201);
      done();
    });
  });

  it('should respond with messages that were previously posted', function(done) {
    var requestParams = {method: 'POST',
      uri: 'http://127.0.0.1:3000/classes/messages',
      json: {
        username: 'Jono',
        message: 'Do my bidding!'}
    };

    request(requestParams, function(error, response, body) {
      // Now if we request the log, that message we posted should be there:
      request('http://127.0.0.1:3000/classes/messages', function(error, response, body) {
        var messages = JSON.parse(body).results;
        expect(messages[0].username).to.equal('Jono');
        expect(messages[0].message).to.equal('Do my bidding!');
        done();
      });
    });
  });

  it('Should 404 when asked for a nonexistent endpoint', function(done) {
    request('http://127.0.0.1:3000/arglebargle', function(error, response, body) {
      expect(response.statusCode).to.equal(404);
      done();
    });
  });

  it('should handle query for reversed order', function(done) {
    var requestParams1 = {method: 'POST',
      uri: 'http://127.0.0.1:3000/classes/messages',
      json: {
        username: 'First',
        text: 'Im old!'}
    };

    var requestParams2 = {method: 'POST',
      uri: 'http://127.0.0.1:3000/classes/messages',
      json: {
        username: 'Second',
        text: 'Im new!'}
    };

    request(requestParams1, function(error, response, body) {
      expect(response.statusCode).to.equal(201);
    });

    request(requestParams2, function(error, response, body) {
      expect(response.statusCode).to.equal(201);
      request('http://127.0.0.1:3000/classes/messages?order=-createdAt', function(error, response, body) {
        var messages = JSON.parse(body).results;
        expect(messages[0].username).to.equal('Second');
        expect(messages[0].text).to.equal('Im new!');
        done();
      });
    });
  });

  //NOTE For this test to pass you MUST RESTART the server every time you run it.
  it('should handle DELETE request', function(done) {
    var requestParams1 = {method: 'POST',
      uri: 'http://127.0.0.1:3000/classes/messages',
      json: {
        username: 'Third',
        text: 'Im third!'}
    };

    var requestParams2 = {method: 'POST',
      uri: 'http://127.0.0.1:3000/classes/messages',
      json: {
        username: 'Fourth',
        text: 'Im fourth!'}
    };

    request(requestParams1, function(error, response, body) {
      expect(response.statusCode).to.equal(201);
    });

    request(requestParams2, function(error, response, body) {
      expect(response.statusCode).to.equal(201);

    });

    const deleteParam = {method: 'DELETE',
      uri: 'http://127.0.0.1:3000/classes/messages?objectId=6',
    };

    request(deleteParam, function(error, response, body) {
      expect(response.statusCode).to.equal(201);
      console.log('response is', response);
      const deletedMessage = JSON.parse(body).body[0];
      console.log('parsed body is', deletedMessage);
      expect(deletedMessage.text).to.equal('Im fourth!');
      expect(deletedMessage.username).to.equal('Fourth');
    });

    request('http://127.0.0.1:3000/classes/messages', function(error, response, body) {
      var messages = JSON.parse(body).results;
      expect(messages[messages.length - 1].username).to.equal('Third');
      done();
    });


  });




});




//
// it('Should delete specific messages', function() {
//   const firstMsg = {
//     username: 'First',
//     text: 'I am old!'
//   };
//   const secondMsg = {
//     username: 'Second',
//     text: 'I am new!'
//   };
//   let req = new stubs.request('/classes/messages', 'POST', firstMsg);
//   let res = new stubs.response();
//   handler.requestHandler(req, res);
//
//   req = new stubs.request('/classes/messages', 'POST', secondMsg);
//   res = new stubs.response();
//   handler.requestHandler(req, res);
//
//   const deleteBad = new stubs.request('/classes/messages?id=5', 'DELETE');
//   const resBad = new stubs.response();
//
//   handler.requestHandler(deleteBad, resBad);
//
//   waitForThen(
//     function() { return resBad._ended; },
//     function() {
//       expect(resBad._responseCode).to.equal(400); //
//     });
//
//   const deleteBad2 = new stubs.request('/classes/messages', 'DELETE');
//   const resBad2 = new stubs.response();
//
//   handler.requestHandler(deleteBad2, resBad2);
//
//   waitForThen(
//     function() { return resBad2._ended; },
//     function() {
//       expect(resBad2._responseCode).to.equal(400); //
//     });
//
//
//   const toDelete = new stubs.request('/classes/messages?id=2', 'DELETE');
//   res = new stubs.response();
//
//   handler.requestHandler(toDelete, res);
//
//   const getRequest = new stubs.request('/classes/messages?order=-createdAt', 'GET');
//   res = new stubs.response();
//
//   handler.requestHandler(getRequest, res);
//
//   const messages = JSON.parse(res._data).results;
//
//   expect(messages.length).to.equal(1);
//   expect(messages[0].username).to.equal('First');
// });
