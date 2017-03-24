const socketio = require('socket.io');
const GameLogic = require('./gameLogic.js');

class WebSocketServer {
  constructor() {
    // A list of users
    this.users = {};
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
      this.onClear(socket);
    });
    socket.on('msg', (message) => {
      this.onMsg(io, socket, message);
    });

    socket.join('room1');

    socket.broadcast.to('room1').emit('addPlayer', socket.user);
    socket.emit('addPlayers', this.users);
    io.sockets.in('room1').emit('msg', `${socket.user.name} has join the room.`);

    socket.emit('username', 'valid');
    socket.emit('drawHistory', this.gameLogic.lines);

    this.gameLogic.addPlayer(socket);

    console.log(`${socket.user.name} has connected.`);
  }

  onDisconnect(io, socket) {
    console.log(`${socket.user.name} has disconnected`);

    io.sockets.in('room1').emit('removePlayer', socket.user.name);
    io.sockets.in('room1').emit('msg', `${socket.user.name} has left the room.`);

    this.gameLogic.removePlayer(socket);

    delete this.users[socket.user.name];

    const isEmpty = () => {
      const keys = Object.keys(this.users);
      if (keys.length === 0) return true;

      return false;
    };

    if (isEmpty()) {
      this.gameLogic.forceClearDrawing();
    }
  }

  onDrawLine(io, socket, line) {
    const playerCanDraw = this.gameLogic.canPlayerDraw(socket);
    if (playerCanDraw) {
      this.gameLogic.addToDrawing(line);
      socket.broadcast.to('room1').emit('drawLine', line);
    }
  }

  onClear(socket) {
    this.gameLogic.clearDrawing(socket);
  }

  onMsg(io, socket, message) {
    if (message !== '' && message !== null) {
      if (this.gameLogic.checkMessage(socket, message)) {
        io.sockets.in('room1').emit('msg', `${socket.user.name}: ${message}`);
      }
    }
  }
}

module.exports = WebSocketServer;
