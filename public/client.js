// Check for the various File API support.
if (!window.File && window.FileReader && window.FileList && window.Blob) {
    alert('The File APIs are not fully supported in this browser.');
}

var WS_SERVER_URL = 'ws://localhost:3000';

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

function createGzipLink(uintArrayData, fileName) {
    var blob = new Blob(uintArrayData, {
        type: 'application/gzip'
    });
    var url = URL.createObjectURL(blob);

    var link = document.createElement('a');
    link.href = url;
    link.download = fileName + '.gz';
    link.innerHTML = 'Download file';
    document.getElementById('list').appendChild(link);
}

function processFile(file, isDecompressing) {
    console.log('Processing file of ' + file.length + ' bytes.');
    console.log('Doing ' + isDecompressing ? 'decompression':'compression');

    var gzip = new Gzipper(file, file.name, 1024);
    var methodName = isDecompressing ? 'decompress' : 'compress';
    var uploader = new WSUploader(WS_SERVER_URL);
    var decompressionResultStrings = [];
    var compressionArrays = [];

    uploader.sendFileInfo({
        name: file.name,
        size: file.size
    });

    // Reads file recursively.
    var readCallback = function(error, result) {
        if (error) {
            alert(error);
        } else {
            var data = result.data;
            // Send file chunk to the server.
            uploader.sendChunk(data);

            if (isDecompressing) {
                var dataString = String.fromCharCode.apply(null, new Uint16Array(data));
                decompressionResultStrings.push(dataString);
            } else {
                compressionArrays.push(data);
            }

            if (result.isAnythingLeft) {
                setTimeout(function () {
                    gzip[methodName](1, readCallback);
                });
            } else {
                console.log('Read completed');
                if (isDecompressing) {
                    putFileStringsToOutput(decompressionResultStrings);
                } else {
                    var jointArray = Array.prototype.concat.apply(compressionArrays[0], compressionArrays.slice(1));
                    createGzipLink(jointArray, file.name);
                    uploader.end();
                }
            }
        }
    };

    gzip[methodName](1, readCallback);
}

function onFileListChanged(e) {
    var files = e.target.files;

    var outHtml = [];
    for (var i = 0, f; f = files[i]; i++) {
        outHtml.push('<li><strong>', encodeURIComponent(f.name), '</strong> (', f.type || 'n/a', ') - ',
            f.size, ' bytes, last modified: ',
            f.lastModifiedDate.toLocaleDateString(), '</li>');
        if (f.name.endsWith('txt.gz')) {
            processFile(f, true);
        } else {
            processFile(f, false);
        }
    }
    document.getElementById('list').innerHTML = '<ul>' + outHtml.join('') + '</ul>';
}

document.getElementById('files').addEventListener('change', onFileListChanged, false);