Gunzipper = function (gzipFile, chunkSize) {
    var self = this;

    self.file = gzipFile;
    self.chunkSize = chunkSize;
    self.currentPosition = 0;
    self.decompressor = new pako.Inflate({
        gzip: true
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
        var chunkBlob = file.slice(currentPosition, endPosition);
        convertBlobToUintArray(chunkBlob, function (error, chunkArray) {
            if (self.decompressor.push(chunkArray, pako.Z_SYNC_FLUSH)) {
                // CAUTION! If set to the endPosition + 1, the CRC check will fail, I don't know why.
                self.currentPosition = endPosition;
                callback(null, {
                    decompressedData: self.decompressor.result,
                    totalBytesRead: endPosition,
                    isAnythingLeft: isAnythingLeft
                });
                if (!isAnythingLeft) {
                    self.decompressor.push([], pako.Z_STREAM_END);
                }
            } else {
                callback(new Error('Failed to decompress data.'));
            }
        });
    };
};