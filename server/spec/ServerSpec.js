var handler = require('../request-handler');
var expect = require('chai').expect;
var stubs = require('./Stubs');

// Conditional async testing, akin to Jasmine's waitsFor()
// Will wait for test to be truthy before executing callback
var waitForThen = function (test, cb) {
  setTimeout(function() {
    test() ? cb.apply(this) : waitForThen(test, cb);
  }, 5);
};

describe('Node Server Request Listener Function', function() {
  it('Should answer GET requests for /classes/messages with a 200 status code', function() {
    // This is a fake server request. Normally, the server would provide this,
    // but we want to test our function's behavior totally independent of the server code
    var req = new stubs.request('/classes/messages', 'GET');
    var res = new stubs.response();

    handler.requestHandler(req, res);

    expect(res._responseCode).to.equal(200);
    expect(res._ended).to.equal(true);
  });

  it('Should send back parsable stringified JSON', function() {
    var req = new stubs.request('/classes/messages', 'GET');
    var res = new stubs.response();

    handler.requestHandler(req, res);

    expect(JSON.parse.bind(this, res._data)).to.not.throw();
    expect(res._ended).to.equal(true);
  });

  it('Should send back an object', function() {
    var req = new stubs.request('/classes/messages', 'GET');
    var res = new stubs.response();

    handler.requestHandler(req, res);

    var parsedBody = JSON.parse(res._data);
    expect(parsedBody).to.be.an('object');
    expect(res._ended).to.equal(true);
  });

  it('Should send an object containing a `results` array', function() {
    var req = new stubs.request('/classes/messages', 'GET');
    var res = new stubs.response();

    handler.requestHandler(req, res);

    var parsedBody = JSON.parse(res._data);
    expect(parsedBody).to.have.property('results');
    expect(parsedBody.results).to.be.an('array');
    expect(res._ended).to.equal(true);
  });

  it('Should accept posts to /classes/room', function() {
    const stubMsg = {
      username: 'Jono',
      text: 'Do my bidding!'
    };
    const req = new stubs.request('/classes/messages', 'POST', stubMsg);
    const res = new stubs.response();

    handler.requestHandler(req, res);

    // Expect 201 Created response status
    expect(res._responseCode).to.equal(201);

    const parsed = JSON.parse(res._data);
    const body = parsed.body;
    expect(body.text).to.equal('Do my bidding!');
    expect(res._ended).to.equal(true);
  });

  it('Should respond with messages that were previously posted', function() {
    const stubMsg = {
      username: 'Jono',
      text: 'Do my bidding!'
    };
    let req = new stubs.request('/classes/messages', 'POST', stubMsg);
    let res = new stubs.response();

    handler.requestHandler(req, res);

    expect(res._responseCode).to.equal(201);

      // Now if we request the log for that room the message we posted should be there:
    req = new stubs.request('/classes/messages', 'GET');
    res = new stubs.response();

    handler.requestHandler(req, res);

    expect(res._responseCode).to.equal(200);
    var messages = JSON.parse(res._data).results;
    expect(messages.length).to.be.above(0);
    expect(messages[0].username).to.equal('Jono'); // TODO: ADD TO LIVE INTEGRATION SPEC
    expect(messages[0].text).to.equal('Do my bidding!');
    expect(res._ended).to.equal(true);
  });


  it('Should 404 when asked for a nonexistent file', function() {
    const req = new stubs.request('/arglebargle', 'GET');
    const res = new stubs.response();

    handler.requestHandler(req, res);

    // Wait for response to return and then check status code
    waitForThen(
      function() { return res._ended; },
      function() {
        expect(res._responseCode).to.equal(404);
      });
  });

  // it('Should handle query for reversed order', function() {
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
  //   const getRequest = new stubs.request('/classes/messages?order=-createdAt', 'GET');
  //   res = new stubs.response();
  //
  //   handler.requestHandler(getRequest, res);
  //
  //   const messages = JSON.parse(res._data).results;
  //
  //   expect(messages[0].username).to.equal('Second');
  //   expect(messages[0].text).to.equal('I am new!');
  // });
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
});
