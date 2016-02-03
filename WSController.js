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
        }));
    }

    _handleClientConnection(clientWebSocket) {
        const binaryData = [];
        let bytesWritten = 0;
        const clientFileInfo = {
            localFileName: null,
            name: null,
            size: null
        };
        let isUploadStarted = false;
        clientWebSocket.on('message', (message, flags) => {
            // flags.binary will be set if a binary data is received.
            // flags.masked will be set if the data was masked.
            console.log('Client message received');
            if (flags.binary) {
                if (!isUploadStarted) {
                    this._sendError(clientWebSocket, 'No file information has been received by the server.');
                    clientWebSocket.close();
                }
                console.log('binary data');
                fs.appendFile(__dirname + '/uploads', flags.buffer, {}, (error) => {
                    if (error) {
                        this._sendError(clientWebSocket);
                        clientWebSocket.close();
                    } else {
                        bytesWritten += flags.buffer.size;
                        if (bytesWritten === clientFileInfo.size) {
                            clientWebSocket.close();
                        }
                    }
                });
                binaryData.push(flags.buffer);
            } else {
                const obj = JSON.parse(message);
                if (!message.name || !message.size) {
                    this._sendError(clientWebSocket, 'Incorrect data format.');
                    clientWebSocket.close();
                } else {
                    clientFileInfo.size = message.size;
                    clientFileInfo.name = message.name;
                    // TODO: don't use original name as file name in production.
                    clientFileInfo.localFileName = message.name + Uuid.v4();
                    isUploadStarted = true;
                    console.log('string data', JSON.stringify(obj, null, 2));
                }
            }
        });

        clientWebSocket.on('error', (error) => {
            console.log('Error in client web socket: ' + JSON.stringify(error));
        });

        clientWebSocket.on('close', () => {
            console.log('WS client disconnected');
            const totalData = Buffer.concat(binaryData);
            fs.writeFileSync('result.bin', totalData);
        });
    }
}

module.exports = WSController;
