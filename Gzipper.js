Gzipper = function (gzipFileBlob, fileName, chunkSize) {
    var self = this;

    self.file = gzipFileBlob;
    self.chunkSize = chunkSize;
    self.currentPosition = 0;
    self.decompressor = new pako.Inflate({
        gzip: true
    });
    // TODO: Extract base and remove copy-paste.
    self.compressor = new pako.Deflate({
        gzip: true,
        header: {
            name: fileName
        }
    });

    function convertBlobToUintArray(blob, callback) {
        var fileReader = new FileReader();
        fileReader.onload = function(progressEvent) {
            var arrayBuffer = fileReader.result;
            var uintArray = new Uint8Array(arrayBuffer);
            callback(null, uintArray);
        };
        fileReader.readAsArrayBuffer(blob);
    }

    self.decompress = function (numChunks, callback) {
        var file = self.file;
        var lastByteNumber = file.size - 1;
        var currentPosition = self.currentPosition;

        var endPosition = currentPosition + numChunks * self.chunkSize;
        if (endPosition > lastByteNumber) {
            endPosition = lastByteNumber;
        }
        var isAnythingLeft = endPosition !== lastByteNumber;
        console.log('Reading chunk from ' + currentPosition + ' to ' + endPosition);
        console.log('have' + (isAnythingLeft ? '' : ' nothing') + ' more');
        var chunkBlob = file.slice(currentPosition, endPosition + 1);
        convertBlobToUintArray(chunkBlob, function (error, chunkArray) {
            var mode = isAnythingLeft ? pako.Z_SYNC_FLUSH : true;
            if (self.decompressor.push(chunkArray, mode)) {
                self.currentPosition = endPosition + 1;
                callback(null, {
                    data: self.decompressor.result,
                    lastByteRead: endPosition,
                    isAnythingLeft: isAnythingLeft
                });
            } else {
                callback(new Error('Failed to decompress data.'));
            }
        });
    };

    self.compress = function (numChunks, callback) {
        var file = self.file;
        var lastByteNumber = file.size - 1;
        var currentPosition = self.currentPosition;

        var endPosition = currentPosition + numChunks * self.chunkSize;
        if (endPosition > lastByteNumber) {
            endPosition = lastByteNumber;
        }
        var isAnythingLeft = endPosition !== lastByteNumber;
        console.log('Reading chunk from ' + currentPosition + ' to ' + endPosition);
        console.log('have' + (isAnythingLeft ? '' : ' nothing') + ' more');
        var chunkBlob = file.slice(currentPosition, endPosition + 1);
        convertBlobToUintArray(chunkBlob, function (error, chunkArray) {
            var mode = isAnythingLeft ? pako.Z_SYNC_FLUSH : true;
            if (self.compressor.push(chunkArray, mode)) {
                self.currentPosition = endPosition + 1;
                callback(null, {
                    data: self.compressor.result,
                    lastByteRead: endPosition,
                    isAnythingLeft: isAnythingLeft
                });
            } else {
                callback(new Error('Failed to decompress data.'));
            }
        });
    }
};