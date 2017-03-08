const http = require('http');
const socketio = require('socket.io');
const fs = require('fs');

// ---- Sets up the web server
const PORT = process.env.PORT || process.env.NODE_PORT || 3000;

const onRequest = (request, response) => {
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
      fs.readFile(`${__dirname}/../client/index.html`, (htmlError, htmlData) => {
        if (htmlError) throw htmlError;

        response.writeHead(200, { 'Content-Type': 'text/html' });
        response.write(htmlData);
        response.end();
      });
      break;
    }
  }
};

const app = http.createServer(onRequest).listen(PORT);

console.log(`Listening on 127.0.0.1:${PORT}`);
//----

// Creates the socketio server
const io = socketio(app);

// A list of users
this.users = {};
this.userCount = 0;

// A list of line objects, acting as a draw hsitory
this.lines = [];

const onDrawLine = (sock) => {
  const socket = sock;

  socket.on('drawLine', (line) => {
    this.lines.push(line);
    socket.broadcast.to('room1').emit('drawLine', line);
  });
};

const onClear = (sock) => {
  const socket = sock;

  socket.on('clear', () => {
    this.lines = [];
    socket.broadcast.to('room1').emit('clear');
  });
};

const onMsg = (sock) => {
  const socket = sock;

  socket.on('msg', (message) => {
    io.sockets.in('room1').emit('msg', `${socket.user.name}: ${message}`);
  });
};

const onDisconnect = (sock) => {
  const socket = sock;

  socket.on('disconnect', () => {
    console.log(`${socket.user.name} has disconnected`);

    io.sockets.in('room1').emit('msg', `${socket.user.name} has left the room.`);

    delete this.users[socket.user.name];
  });
};

// Called when a user connects to the server
io.sockets.on('connection', (sock) => {
  const socket = sock;

  console.log('A new user has connected');

  const username = `User ${++this.userCount}`;
  this.users[username] = {
    name: username,
  };

  socket.user = this.users[`User ${this.userCount}`];
  socket.join('room1');

  // Sets up all the events
  onDrawLine(socket);
  onClear(socket);
  onMsg(socket);
  onDisconnect(socket);

  io.sockets.in('room1').emit('msg', `${socket.user.name} has join the room.`);

  socket.emit('drawHistory', this.lines);
});

console.log('Websocket server started');
