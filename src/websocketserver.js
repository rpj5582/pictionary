const socketio = require('socket.io');
const GameLogic = require('./gameLogic.js');

class WebSocketServer {
  constructor() {
    // A list of users
    this.users = {};

    // A list of line objects, acting as a draw hsitory
    this.lines = [];
  }

  start(httpServer) {
    // Creates the socketio server
    const io = socketio(httpServer);

    io.sockets.on('connection', (socket) => {
      this.onConnect(io, socket);
    });

    this.gameLogic = new GameLogic(io);

    console.log('Websocket server started');
  }

  onConnect(io, sock) {
    const socket = sock;

    const username = socket.handshake.query.username;
    if (username === null || username === '') {
      socket.emit('username', 'invalid');
      socket.disconnect();
      return;
    }

    if (this.users[username] !== undefined) {
      socket.emit('username', 'taken');
      socket.disconnect();
      return;
    }

    this.users[username] = {
      name: username,
    };
    socket.user = this.users[username];

    socket.on('disconnect', () => {
      this.onDisconnect(io, socket);
    });
    socket.on('drawLine', (line) => {
      this.onDrawLine(io, socket, line);
    });
    socket.on('clear', () => {
      this.onClear(io, socket);
    });
    socket.on('msg', (message) => {
      this.constructor.onMsg(io, socket, message);
    });

    socket.join('room1');

    io.sockets.in('room1').emit('msg', `${socket.user.name} has join the room.`);

    socket.emit('username', 'valid');
    socket.emit('drawHistory', this.lines);

    console.log(`${socket.user.name} has connected.`);
  }

  onDisconnect(io, socket) {
    console.log(`${socket.user.name} has disconnected`);

    io.sockets.in('room1').emit('msg', `${socket.user.name} has left the room.`);

    delete this.users[socket.user.name];
  }

  onDrawLine(io, socket, line) {
    this.lines.push(line);
    socket.broadcast.to('room1').emit('drawLine', line);
  }

  onClear(io, socket) {
    this.lines = [];
    socket.broadcast.to('room1').emit('clear');
  }

  static onMsg(io, socket, message) {
    if (message !== '' && message !== null) {
      io.sockets.in('room1').emit('msg', `${socket.user.name}: ${message}`);
    }
  }
}

module.exports = WebSocketServer;
