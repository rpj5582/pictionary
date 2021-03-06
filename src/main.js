const HTTPServer = require('./httpserver.js');
const WebSocketServer = require('./websocketserver.js');

const httpServer = new HTTPServer();
const server = httpServer.start();

const webSocketServer = new WebSocketServer();
webSocketServer.start(server);
