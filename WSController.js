'use strict';

const fs = require('fs');
const async = require('async');
const Uuid = require('node-uuid');

class WSController {
    constructor() {}

    addWebSocketServerCallbacks(wsServer) {
        wsServer.on('connection', (clientWebSocket) => {
            console.log('WS client connected');
            this._handleClientConnection(clientWebSocket);
        });
    }

    _sendError(clientWebSocket, message) {
        console.log('Error: ', message);
        clientWebSocket.send(JSON.stringify({
            message
        }), (error) => {
            console.error('Error sending message to client: ' + JSON.stringify(error));
        });
    }

    _handleClientConnection(clientWebSocket) {
        let bytesWritten = 0;
        const clientFileInfo = {
            localFileName: null,
            name: null,
            size: null
        };
        let isUploadStarted = false;
        clientWebSocket.on('message', (messageString, flags) => {
            // flags.binary will be set if a binary data is received.
            // flags.masked will be set if the data was masked.
            console.log('Client message received');
            if (flags.binary) {
                if (!isUploadStarted) {
                    this._sendError(clientWebSocket, 'No file information has been received by the server.');
                    clientWebSocket.close();
                }
                console.log('binary data');
                fs.appendFile(__dirname + '/uploads/' + clientFileInfo.localFileName, flags.buffer, {}, (error) => {
                    if (error) {
                        this._sendError(clientWebSocket, error);
                        clientWebSocket.close();
                    } else {
                        bytesWritten += flags.buffer.length;
                    }
                });
            } else {
                const message = JSON.parse(messageString || 'null');
                if (!message.name || !message.size) {
                    this._sendError(clientWebSocket, 'Incorrect data format.');
                    clientWebSocket.close();
                } else {
                    clientFileInfo.size = message.size;
                    clientFileInfo.name = message.name;
                    // TODO: don't use original name as file name in production.
                    clientFileInfo.localFileName = message.name + Uuid.v4();
                    isUploadStarted = true;
                    console.log('string data', JSON.stringify(message, null, 2));
                }
            }
        });

        clientWebSocket.on('error', (error) => {
            console.log('Error in client web socket: ' + JSON.stringify(error));
        });

        clientWebSocket.on('close', () => {
            console.log('WS client disconnected, upload completed.');
        });
    }
}

module.exports = WSController;
