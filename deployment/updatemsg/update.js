const http = require('http');
const path = require('path');
const fileSystem = require('fs');

const hostname = '127.0.0.1';
const port = 3000;

const file = 'update.html';

const server = http.createServer((req, res) => {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/html; charset=UTF-8');
  res.setHeader('Cache-Control', 'public, max-age=90');
  var filePath = path.join(__dirname, file);
  var readStream = fileSystem.createReadStream(filePath);
  readStream.pipe(res);
});

server.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
});
