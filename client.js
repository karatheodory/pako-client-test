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
    console.log('Processing file of ' + file.length + ' bytes.');
    var gunzipper = new Gunzipper(file, 1024);
    var resultStrings = [];

    // Reads file recursively.
    var readCallback = function(error, result) {
        if (error) {
            alert(error);
        } else {
            var data = result.decompressedData;
            var dataString = String.fromCharCode.apply(null, new Uint16Array(data));
            resultStrings.push(dataString);

            if (result.isAnythingLeft) {
                setTimeout(function () {
                    gunzipper.decompress(2, readCallback);
                })
            } else {
                console.log('Read completed');
                putFileStringsToOutput(resultStrings);
            }
        }
    };

    gunzipper.decompress(1, readCallback);
    putFileStringsToOutput(resultStrings)
}

function onFileListChanged(e) {
    var files = e.target.files;

    var outHtml = [];
    for (var i = 0, f; f = files[i]; i++) {
        outHtml.push('<li><strong>', encodeURIComponent(f.name), '</strong> (', f.type || 'n/a', ') - ',
            f.size, ' bytes, last modified: ',
            f.lastModifiedDate.toLocaleDateString(), '</li>');
        if (f.name.endsWith('txt.gz')) {
            processFile(f);
        }
    }
    document.getElementById('list').innerHTML = '<ul>' + outHtml.join('') + '</ul>';
}

document.getElementById('files').addEventListener('change', onFileListChanged, false);