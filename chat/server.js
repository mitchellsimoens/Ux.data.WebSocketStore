var express = require('express'),
    gzip    = require('connect-gzip'),
    app     = express.createServer(
        gzip.gzip()
    ),
    io      = require('socket.io').listen(app),
    clone   = function(obj, flat) {
        var newObj = {},
            key;

        for (key in obj) {
            if (obj.hasOwnProperty(key)) {
                newObj[key] = flat || typeof obj[key] !== 'object' ? obj[key] : clone(obj[key]);
            }
        }

        return newObj;
    };

app.configure(function () {
    app.use(express.static(__dirname + '/'));
});

app.get('/', function (req, res) {
    res.render('index', { layout : false });
});

app.listen(8080, function () {
    var addr = app.address();
    console.log('   app listening on http://' + addr.address + ':' + addr.port);
});

io.sockets.on('connection', function (socket) {
    socket.on('keep-alive', function () {
        socket.emit('keep-alive', null);
    });

    socket.on('login', function(data) {
        socket.on('register', function (socketId) {
            socket.volatile.emit('register', true);
        });

        socket.on('create', function (record) {
            var clientId = record.clientId;

            delete record.clientId;

            record.id = new Date().getTime();

            socket.broadcast.emit('create', {
                success : true,
                data    : [ record ]
            });

            record.clientId = clientId;

            socket.volatile.emit('create', {
                success : true,
                data    : [ record ]
            });
        });

        socket.on('create_user', function (record) {
            var clientId = record.clientId;

            delete record.clientId;

            record.id = new Date().getTime();

            socket.broadcast.emit('create_user', {
                success : true,
                data    : [ record ]
            });

            record.clientId = clientId;

            socket.volatile.emit('create_user', {
                success : true,
                data    : [ record ]
            });
        });

        socket.on('read_user', function() {
            var socks = io.sockets.sockets,
                users = [],
                sockId, sock;

            for (sockId in socks) {
                if (socks.hasOwnProperty(sockId)) {
                    sock = socks[sockId];

                    if (sock.username) {
                        users.push({
                            name : sock.username
                        });
                    }
                }
            }

            socket.broadcast.emit('read_user', {
                success : true,
                data    : users
            });

            socket.volatile.emit('read_user', {
                success : true,
                data    : users
            });
        });

        socket.volatile.emit('login', {
            success  : true,
            name     : socket.username = data.name,
            socketId : socket.id
        });
    });

    socket.on('disconnect', function (reason) {
        socket.removeAllListeners('login');
        socket.removeAllListeners('create');
        socket.removeAllListeners('create_user');
        socket.removeAllListeners('read_user');
        socket.removeAllListeners('disconnect');

        var socks = io.sockets.sockets,
            users = [],
            sockId, sock;

        for (sockId in socks) {
            if (socks.hasOwnProperty(sockId)) {
                sock = socks[sockId];

                if (sock.username && (sock.id !== socket.id)) {
                    users.push({
                        name : sock.username
                    });
                }
            }
        }

        socket.broadcast.emit('read_user', {
            success : true,
            data    : users
        });
    });
});