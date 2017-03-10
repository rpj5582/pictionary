const http = require('http');
const fs = require('fs');

class HTTPSever {
  constructor() {
    this.PORT = process.env.PORT || process.env.NODE_PORT || 3000;
  }

  onRequest(request, response) {
    switch (request.url) {
      case '/cursor.js': {
        fs.readFile(`${__dirname}/../client/cursor.js`, (cursorError, cursorData) => {
          if (cursorError) throw cursorError;

          response.writeHead(200, { 'Content-Type': 'application/javascript' });
          response.write(cursorData);
          response.end();
        });
        break;
      }

      case '/gameBoard.js': {
        fs.readFile(`${__dirname}/../client/gameBoard.js`, (gameBoardError, gameBoardData) => {
          if (gameBoardError) throw gameBoardError;

          response.writeHead(200, { 'Content-Type': 'application/javascript' });
          response.write(gameBoardData);
          response.end();
        });
        break;
      }

      case '/app.js': {
        fs.readFile(`${__dirname}/../client/app.js`, (appError, appData) => {
          if (appError) throw appError;

          response.writeHead(200, { 'Content-Type': 'application/javascript' });
          response.write(appData);
          response.end();
        });
        break;
      }

      case '/pencil.png': {
        fs.readFile(`${__dirname}/../client/pencil.png`, (pngError, pngData) => {
          if (pngError) throw pngError;

          response.writeHead(200, { 'Content-Type': 'image/png' });
          response.write(pngData);
          response.end();
        });
        break;
      }

      case '/main.css': {
        fs.readFile(`${__dirname}/../client/main.css`, (cssError, cssData) => {
          if (cssError) throw cssError;

          response.writeHead(200, { 'Content-Type': 'text/css' });
          response.write(cssData);
          response.end();
        });
        break;
      }

      default: {
        fs.readFile(`${__dirname}/../client/index.html`, (indexError, indexData) => {
          if (indexError) throw indexError;

          response.writeHead(200, { 'Content-Type': 'text/html' });
          response.write(indexData);
          response.end();
        });
        break;
      }
    }
  }

  start() {
    const app = http.createServer(this.onRequest).listen(this.PORT);
    console.log(`HTTP server started on 127.0.0.1:${this.PORT}`);
    return app;
  }
}

module.exports = HTTPSever;
