'use strict';

const async = require('async');
const Optimist = require('optimist');
const WSClient = require('./WSClient');

const argv = Optimist.argv;
if (!argv.path || !argv.url) {
    console.error('Usage: --path path/to/file.here --url ws://host:port');
    process.exit(1);
}

const wsClient = new WSClient();
async.waterfall([
    (callback) => wsClient.connect(argv.url, callback),
    (callback) => wsClient.uploadFile(argv.path, callback)
],(error) => {
    if (error) {
        console.error(JSON.stringify(error));
    } else {
        console.log('Upload successful. Waiting for server to close the socket...');
    }
});
