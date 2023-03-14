var express = require('express');
var http = require('http');
var https = require('https');

var app = express();

app.use('/proxy', (req, res) => {
  // Extract the protocol, domain, and path from the query string
  var { protocol, domain } = req.query;

  // Create the request options
  var isHttps = protocol !== 'http';
  var options = {
    method: req.method,
    host: domain,
    port: isHttps ? 443 : 80,
    path: req.path,
    query: req.query,
    headers: req.headers,
    body: req.body
  };

  delete options.headers.host;
  delete options.headers.referer;
  delete options.headers.referrerPolicy;
  delete options.query.domain;
  delete options.query.protocol;

  // Add the port number to the options if the protocol is HTTPS
  var request = isHttps ? https.request : http.request;
 
  const proxyReq = request(options, function (proxyRes) {
    // set http status code based on proxied response
    res.writeHead(proxyRes.statusCode, proxyRes.headers);

    // wait for data
    proxyRes.on('data', chunk => {
      res.write(chunk);
    });

    proxyRes.on('close', () => {
      // closed, let's end client request as well
      res.end();
    });

    proxyRes.on('end', () => {
      // finished, let's finish client request as well
      res.end();
    });
  })
  .on('error', e => {
    try {
      // attempt to set error message and http status
      res.writeHead(500);
      res.write(e.message);
    } catch (e) {
      // ignore
    }
    
    res.end();
  });

  req.pipe(proxyReq);
});

app.listen(3000, () => {
  console.log('Server started on port 3000');
});