const http = require('http');
const socketio = require('socket.io');

const PORT = process.env.PORT || process.env.NODE_PORT || 3000;

const onRequest = (request, response) => {
  response.writeHead(200, { 'Content-Type': 'text/html' });
  response.end();
};

const app = http.createServer(onRequest).listen(PORT);

console.log(`Listening on 127.0.0.1:${PORT}`);

const io = socketio(app);

const onJoin = (sock) => {
  const socket = sock;
};

const onLeave = (sock) => {
  const socket = sock;
};

io.sockets.on('connection', (socket) => {
  console.log('Connection opened');

  onJoin(socket);
  onLeave(socket);
});

console.log('Websocket server started');
