/*************************************************************

You should implement your request handler function in this file.

requestHandler is already getting passed to http.createServer()
in basic-server.js, but it won't work as is.

You'll have to figure out a way to export this function from
this file and include it in basic-server.js so that it actually works.

*Hint* Check out the node module documentation at http://nodejs.org/api/modules.html.

**************************************************************/

var defaultCorsHeaders = {
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'access-control-allow-headers': 'content-type, accept',
  'access-control-max-age': 10, // Seconds.

};

const results = require('./messages');
const urlMethods = require('url');
const fs = require("fs");


var requestHandler = function(request, response) {

  console.log('Serving request type ' + request.method + ' for url ' + request.url);

  const { method, url } = request; //Get request info
  var headers = defaultCorsHeaders;
  headers['Content-Type'] = 'application/json';

  const queryArray = urlMethods.parse(url, true);
  const path = queryArray.pathname;

  if (path === '/' || path.match(/\.(?=css$|js$|gif$)/g) !== null) {
    let base = '../client';
    base += path === '/' ? '/index.html' : path;
    fs.readFile(base, function (err, data) {
      if (err) {
        return console.error(err);
      }
      response.end(data.toString());
    });
  } else if (!url.startsWith("/classes/messages")) {
    console.log('WRONG URL', url);
    response.writeHead(404, headers);
    response.end();
  } else if (method === 'GET' || method === "OPTIONS") {
    response.writeHead(200, headers);
    let responseBody;
    if (queryArray.query['order'] && queryArray.query['order'] === '-createdAt') {
      const reverseResults = results.slice().reverse();
      responseBody = { method, url };
      responseBody.results = reverseResults;
    } else {
      responseBody = { method, url, results };
    }
    response.end(JSON.stringify(responseBody));
  } else if (method === 'POST') {
    let body = [];

    request.on('data', (chunk) => {
      body.push(chunk);
    });

    request.on('error', (err) => {
      // This prints the error message and stack trace to `stderr`.
      console.error(err.stack);
      response.end('Error 404');
    });

    request.on('end', () => {
      const resultObj = JSON.parse(body.toString());
      resultObj.createdAt = new Date();
      resultObj.objectId = results.length ? results[results.length - 1].objectId + 1 : 1;
      results.push(resultObj);
      response.writeHead(201, headers);
      const responseBody = { method, url };
      responseBody.body = resultObj;
      response.end(JSON.stringify(responseBody));
    });
  } else if (method === 'DELETE') { //NOTE: To delete, pass in object id url?objectId=[num]
    let deletedMessage;
    let isFound = false;
    if (queryArray.query['objectId']) {
      const targetId = Number(queryArray.query['objectId']);
      for (let i = 0; i < results.length; i++) {
        if (results[i].objectId === targetId) {
          deletedMessage = results.splice(i, 1);
          isFound = true;
        }
      }
      if (isFound) {
        response.writeHead(201, headers);
        const responseBody = { method, url };
        responseBody.body = deletedMessage;
        response.end(JSON.stringify(responseBody));
      } else {
        response.writeHead(400, headers);
        response.end();
      }
    } else {
      response.writeHead(400, headers);
      response.end();
    }

  }

};

// These headers will allow Cross-Origin Resource Sharing (CORS).
// This code allows this server to talk to websites that
// are on different domains, for instance, your chat client.
//
// Your chat client is running from a url like file://your/chat/client/index.html,
// which is considered a different domain.
//
// Another way to get around this restriction is to serve you chat
// client from this domain by setting up static file serving.



exports.requestHandler = requestHandler;
