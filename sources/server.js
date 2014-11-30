var HTML_PATH = 'html',
    http = require('http'),
    url = require('url'),
    path = require('path'),
    fs = require('fs'),
    port,
    prefixTodo = '/todo/',
    lastId = 3,
    todos = [
        {
            id: 0,
            isCompleted: false,
            text: 'Some first todo'
        },
        {
            id: 1,
            isCompleted: true,
            text: 'Another already done todo'
        },
        {
            id: 2,
            isCompleted: false,
            text: 'One more todo'
        },
        {
            id: 3,
            isCompleted: false,
            text: 'This is demo TODO'
        }
    ],
    mimes = {
        html: 'text/html',
        js: 'text/javascript',
        css: 'text/css',
        json: 'application/json',
        plain: 'text/plain'
    },
    requests = {
        PUT: function(uri, req, resp) {
            var id,
                updated = true,
                ind;

            if (!isNaN(uri)) {
                id = parseInt(uri, 10);

                for (ind = todos.length - 1; ind >= 0; --ind) {
                    if (todos[ind].id === id) {
                        todos[ind].isCompleted = true;
                        updated = true;
                        break;
                    }
                }

                if (updated) {
                    resp.setHeader('Content-Type', 'application/json');
                    resp.end();
                } else {
                    console.error('id [' + uri + '] not found');
                    requests.NotFound(req, resp);
                }
            } else {
                console.error('Invalid id [' + uri + ']');
                requests.NotFound(req, resp);
            }
        },
        GET: function(uri, req, resp) {
            resp.setHeader('Content-Type', mimes.json);
            resp.write(JSON.stringify(todos));
            resp.end();
        },
        DELETE: function(uri, req, resp) {
            var id,
                deleted = true,
                ind;

            if (!isNaN(uri)) {
                id = parseInt(uri, 10);

                for (ind = todos.length - 1; ind >= 0; --ind) {
                    if (todos[ind].id === id) {
                        deleted = true;
                        todos.splice(ind, 1);
                        break;
                    }
                }

                if (deleted) {
                    resp.setHeader('Content-Type', mimes.json);
                    resp.end();
                } else {
                    console.error('id [' + uri + '] not found');
                    requests.NotFound(req, resp);
                }
            } else {
                console.error('Invalid id [' + uri + ']');
                requests.NotFound(req, resp);
            }
        },
        POST: function(uri, req, resp) {
            var body = '';

            req.on('data', function (chunk) {
                body += chunk;
            });

            req.on('end', function () {
                if (body) {
                    ++lastId;
                    todos[todos.length] = {
                        id: lastId,
                        isCompleted: false,
                        text: body
                    };

                    resp.setHeader('Content-Type', mimes.json);
                    resp.write(JSON.stringify(todos[todos.length - 1]));
                    resp.end();
                } else {
                    requests.NotFound(req, resp);
                }
            });
        },
        Default: function(uri, req, resp) {
            requests.NotFound(req, resp);
        },
        NotFound: function(req, resp) {
            resp.writeHeader(404, {'Content-Type': mimes.plain});
            resp.write('No page found');
            resp.end();
        }
    };

if (process.argv.length !== 3) {
    console.error('Server port is required');
    process.exit(1);
}

port = parseInt(process.argv[2]);

if (isNaN(port)) {
    console.error('Port should be a number');
    process.exit(1);
}

console.log('Running server on port ' + port);

http.createServer(function(req, resp) {
    var pathName = url.parse(req.url).pathname,
        reqFn,
        fileName;

    if (0 === pathName.indexOf(prefixTodo)) { //data requests
        reqFn = requests[req.method] || requests.Default;
        reqFn(pathName.substr(prefixTodo.length), req, resp);
    } else { //static files
        fileName = path.normalize(path.join(process.cwd(), HTML_PATH,
                                            pathName));

        if (0 !== fileName.indexOf(path.normalize(__dirname, HTML_PATH))) {
            console.error('Invalid file path [' + fileName + ']');
            requests.NotFound(req, resp);
        } else {
            fs.exists(fileName, function(exists) {
                if(exists) {
                    if (fs.statSync(fileName).isDirectory()) {
                        fileName = path.join(fileName, 'index.html');
                    }

                    fs.readFile(fileName, 'binary', function(err, file) {
                        if (!err) {
                            resp.writeHeader(200, {
                                'Content-Type': mimes[path.extname(fileName).
                                                    split('.')[1]]
                            });
                            resp.write(file, 'binary');
                            resp.end();
                        } else {
                            requests.NotFound(req, resp);
                        }
                    });
                } else {
                    requests.NotFound(req, resp);
                }
            });
        }
    }
}).listen(port);
