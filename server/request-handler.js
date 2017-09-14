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

var requestHandler = function(request, response) {
  console.log('Serving request type ' + request.method + ' for url ' + request.url);
  let statusCode = 200;

  const { method, url } = request; //Get request info
  var headers = defaultCorsHeaders;
  headers['Content-Type'] = 'application/json';

  if (!url.startsWith("/classes/messages")) {
    console.log('WRONG URL', url);
    statusCode = 404;
    response.writeHead(statusCode, headers);
    response.end();
  }

  if (method === 'GET' || method === "OPTIONS") {
    response.writeHead(statusCode, headers);
    const responseBody = { headers, method, url, results };
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
      resultObj.objectId = results.length + 1;
      results.push(resultObj);
      statusCode = 201;
      response.writeHead(statusCode, headers);
      const responseBody = { headers, method, url, body };
      response.end(JSON.stringify(responseBody));
    });

  } else {
    response.end();
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
