Gzipper = function (gzipFileBlob, fileName, chunkSize) {
    var self = this;

    self.file = gzipFileBlob;
    self.chunkSize = chunkSize;
    self.currentPosition = 0;

    // It is better not to do so and split the class onto two different,
    // for compression and for decompression.
    self.decompressor = new pako.Inflate({
        gzip: true
    });
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

    self._forNumChunks = function(numChunks, callback) {
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
            callback(error, {
                isAnythingLeft: isAnythingLeft,
                chunkArray: chunkArray,
                currentPosition: currentPosition,
                endPosition: endPosition
            });
        });
    };

    self.decompress = function (numChunks, callback) {
        self._forNumChunks(numChunks, function (error, chunkDescriptor) {
            var isAnythingLeft = chunkDescriptor.isAnythingLeft;
            var chunkArray = chunkDescriptor.chunkArray;
            var endPosition = chunkDescriptor.endPosition;

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
        self._forNumChunks(numChunks, function (error, chunkDescriptor) {
            var isAnythingLeft = chunkDescriptor.isAnythingLeft;
            var chunkArray = chunkDescriptor.chunkArray;
            var endPosition = chunkDescriptor.endPosition;

            var mode = isAnythingLeft ? pako.Z_SYNC_FLUSH : true;
            if (self.compressor.push(chunkArray, mode)) {
                self.currentPosition = endPosition + 1;
                callback(null, {
                    data: self.compressor.result,
                    lastByteRead: endPosition,
                    isAnythingLeft: isAnythingLeft
                });
            } else {
                callback(new Error('Failed to compress data.'));
            }
        });
    }
};