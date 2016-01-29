// Check for the various File API support.
if (!window.File && window.FileReader && window.FileList && window.Blob) {
    alert('The File APIs are not fully supported in this browser.');
}

var Compressor = function() {
    var self = this;
    this.compressor = new pako.Deflate({
        gzip: true
    });

    self.compressor.onEnd(function (status) {
        if (status !== pako.Z_OK) {
            console.log('Compression error: ' + status);
        }

        self.lastError = status;
    });
    self.compressor.onData(function(chunk) {
        console.log('Received chunk!');
    });

    self.compressChunk = function(chunk, isEndChunk) {
        const mode = isEndChunk ? pako.Z_STREAM_END : pako.Z_SYNC_FLUSH;
        if (self.compressor.push(chunk, mode)) {
            return self.compressor.result;
        } else {
            console.log('Error compressing data');
            return null;
        }
    };
};

var Decompressor = function() {
    var self = this;
    self.decompressor = new pako.Inflate({
        gzip: true
    });

    self.decompressChunk = function(chunk, isEndChunk) {
        const mode = isEndChunk ? pako.Z_STREAM_END : pako.Z_SYNC_FLUSH;
        if (self.decompressor.push(chunk, mode)) {
            return self.decompressor.result;
        } else {
            console.error('Error decompressing data.');
            return null;
        }
    };
};

function putFileStringsToOutput(stringArray) {
    var resultHtml = '';
    stringArray.forEach(function (str) {
        var parts = str.split('\n');
        parts.forEach(function (part) {
            if (part !== '') {
                resultHtml += '<p>' + part + '</p>';
            }
        });
    });
    document.getElementById('fileContents').innerHTML = resultHtml;
}

function processFile(file) {
    var decompressor = new Decompressor();
    var CHUNK_SIZE = 1024;
    const upperBorder = file.length > CHUNK_SIZE ? file.length - CHUNK_SIZE : file.length;
    var resultStrings = [];

    for (var i = 0; i < upperBorder; i += CHUNK_SIZE) {
        var chunk = file.slice(i, i + CHUNK_SIZE);
        var isEndChunk = (i + CHUNK_SIZE >= file.length);
        var decompressedData = decompressor.decompressChunk(chunk, isEndChunk);
        var dataString = String.fromCharCode.apply(null, new Uint16Array(decompressedData));
        resultStrings.push(dataString);
    }
    putFileStringsToOutput(resultStrings)
}

function convertBlobToUintArray(blob, callback) {
    var fileReader = new FileReader();
    fileReader.onload = function(progressEvent) {
        var arrayBuffer = fileReader.result;
        var uintArray = new Uint8Array(arrayBuffer);
        callback(null, uintArray);
    };
    fileReader.readAsArrayBuffer(blob);
}

function onFileListChanged(e) {
    var files = e.target.files;

    var outHtml = [];
    for (var i = 0, f; f = files[i]; i++) {
        outHtml.push('<li><strong>', encodeURIComponent(f.name), '</strong> (', f.type || 'n/a', ') - ',
            f.size, ' bytes, last modified: ',
            f.lastModifiedDate.toLocaleDateString(), '</li>');

        convertBlobToUintArray(f, (error, result) => {
            processFile(result);
        });
    }
    document.getElementById('list').innerHTML = '<ul>' + outHtml.join('') + '</ul>';
}

document.getElementById('files').addEventListener('change', onFileListChanged, false);