'use strict';

const fs = require('fs');
const path = require('path');
const async = require('async');
const Uuid = require('node-uuid');

const WebSocketClient = require('ws');

class WSClient {
    uploadFile(filePath, callback) {
        if (!this.socket) {
            callback(new Error('Socket is disconnected'));
        }

        async.waterfall([
            (callback) => {
                console.log('Getting file stats...');
                fs.stat(filePath, callback);
            },
            (stats, callback) => {
                console.log('Collect necessary file info...');
                const size = stats['size'];
                const stream = fs.createReadStream(filePath, {
                    flags: 'r',
                    mode: 0o666,
                    highWaterMark: 1024
                });
                const name = path.basename(filePath);
                callback(null, {
                    name,
                    size,
                    stream
                });
            },
            (fileDescriptor, callback) => {
                console.log('Sending file info...');
                // Send file info first.
                const fileInfo = {
                    id: Uuid.v4(), // Session id.
                    sample_id: fileDescriptor.name,
                    size: fileDescriptor.size
                };
                const fileInfoString = JSON.stringify(fileInfo);
                this.socket.send(fileInfoString, (error) => {
                    callback(error, fileDescriptor);
                });
            },
            (fileDescriptor, callback) => {
                console.log('Sending file...');
                const stream = fileDescriptor.stream;
                stream.on('end', () => {
                    stream.close();
                    callback(null);
                });
                stream.on('data', (data) => {
                    this.socket.send(data, {
                        binary: true,
                        mask: false
                    }, (error) => {
                        if (error) {
                            stream.close();
                            callback(error);
                        }
                    });
                });
            }
        ], callback);
    }

    disconnect() {
        this.socket.close();
    }

    connect(address, callback) {
        this.socket = new WebSocketClient(address);
        this.socket.on('message', (message) => {
            console.log('Server message: ' + message);
        });

        this.socket.on('close', () => {
            console.log('Server socket closed');
        });

        this.socket.on('error', (error) => {
            console.log('Server socket error: ' + JSON.stringify(error));
        });

        // No 'connected' event, so just wait and hope.
        setTimeout(callback, 1000);
    }
}

module.exports = WSClient;
