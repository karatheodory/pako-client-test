'use strict';

const Express = require('express');
const Http = require('http');
const WebSocketServer = require('ws').Server;

const WSController = require('./WSController');

const PORT = 3000;

const httpServer = Http.createServer();
const app = new Express();

app.use('/', Express.static('./public'));
app.use('/lib', Express.static('./bower_components'));

const webSocketServer = new WebSocketServer({
    server: httpServer
});
const wsController = new WSController();

wsController.addWebSocketServerCallbacks(webSocketServer);
httpServer.on('request', app);
httpServer.listen(PORT, function() {
    const host = httpServer.address().address;
    const port = httpServer.address().port;

    console.log('The server is started on http://%s:%s', host, port);
});
