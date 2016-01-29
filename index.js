'use strict';

const Express = require('express'),
    Http = require('http'),
    Formidable = require('formidable'),
    fs = require('fs'),
    Path = require('path');

const app = new Express();

app.use('/', Express.static('./'));

app.post('/upload', (request, response) => {
    const form = new Formidable.IncomingForm();
    form.parse(request, (error, fields, files) => {
        // `file` is the name of the <input> field of type `file`
        var oldPath = files.file.path,
            fileSize = files.file.size,
            originalFileName = files.file.name,
            fileExt = originalFileName.split('.').pop(),
            index = oldPath.lastIndexOf('/') + 1,
            fileName = oldPath.substr(index),
            newPath = Path.join(__dirname, '/uploads/', fileName + '.' + fileExt);
        console.log('Started upload: ' + originalFileName + ', size: ' + fileSize + ' bytes');

        fs.readFile(oldPath, (err, data) => {
            fs.writeFile(newPath, data, function(err) {
                fs.unlink(oldPath, function(err) {
                    if (err) {
                        response
                            .status(500)
                            .json({'success': false});
                    } else {
                        response
                            .status(200)
                            .json({'success': true});
                    }
                });
            });
        });
    });
});

app.listen(3000, () => {
    console.log('Server is started on port 3000');
});