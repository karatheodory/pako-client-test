WSUploader = function(serverUrl) {
    var self = this;

    var initWebSocket = function(callback) {
        if (self.ws) {
            callback();
            return;
        }
        self.ws = new WebSocket(serverUrl);
        self.ws.binaryType = 'arraybuffer'; // can be 'blob' instead.
        self.ws.onclose = function() {
            if (self.onclose) {
                self.onclose();
            }
            console.log('WS closed');
        };

        self.ws.onmessage = function(message) {
            if (self.onmessage) {
                self.onmessage(message);
            }
            console.log('WS message: ' + message);
        };
        self.ws.onopen = function() {
            if (self.onopen) {
                self.onopen();
            }
            console.log('WS opened');
            callback();
        };
    };

    self.sendFileInfo = function(fileInfo) {
        initWebSocket(function() {
            self.ws.send(JSON.stringify(fileInfo));
        });
    };

    self.sendChunk = function(fileChunk) {
        initWebSocket(function() {
            self.ws.send(fileChunk);
        });
    };

    self.end = function() {
        self.ws.close();
    };
};
