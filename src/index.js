var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var canvasData;
var first = true;
var connectCounter = 0;
var numUsers = 0;

/*
app.use('/css', express.static(__dirname + '/css'));
app.use('/js', express.static(__dirname + '/js'));

app.get('/', function (req, res) {
    res.sendFile(__dirname + '/index.html');
}); */

app.use(express.static(__dirname + '/public'));

io.on('connection', function (socket) {

    console.log('Usuario conectado', socket.id);
    connectCounter++;
    console.log('Num Usuarios: ' + connectCounter);

    socket.on('disconnect', function () {
        console.log('Usuario desconectado');
        connectCounter--;
        if (connectCounter == 0) {
            first = true;
        }
        console.log('Se desconectó un usuario');
        console.log('Num Usuarios: ' + connectCounter);
        if (addedUser) {
            --numUsers;

            // echo globally that this client has left
            socket.broadcast.emit('user left', {
                username: socket.username,
                numUsers: numUsers
            });
        }
    });

    socket.on('ready', function (msg) {
        console.log(msg);
    });

    socket.on('drawing', function (data) {
        console.log("Drawing");
        canvasData = data;
        socket.broadcast.emit('drawing', canvasData);
    });

    socket.on('load', function (msg) {
        console.log(msg);
        if (first == true) {
            first = false;
        } else {
            socket.emit('drawing', canvasData);
        }

    });
    /***********CHAT ************/
    var addedUser = false;

    // when the client emits 'new message', this listens and executes
    socket.on('new message', (data) => {
        // we tell the client to execute 'new message'
        socket.broadcast.emit('new message', {
            username: socket.username,
            message: data
        });
    });

    // when the client emits 'add user', this listens and executes
    socket.on('add user', (username) => {
        if (addedUser) return;

        // we store the username in the socket session for this client
        socket.username = username;
        ++numUsers;
        addedUser = true;
        socket.emit('login', {
            numUsers: numUsers
        });
        // echo globally (all clients) that a person has connected
        socket.broadcast.emit('user joined', {
            username: socket.username,
            numUsers: numUsers
        });
    });

    // when the client emits 'typing', we broadcast it to others
    socket.on('typing', () => {
        socket.broadcast.emit('typing', {
            username: socket.username
        });
    });

    // when the client emits 'stop typing', we broadcast it to others
    socket.on('stop typing', () => {
        socket.broadcast.emit('stop typing', {
            username: socket.username
        });
    });

    // when the user disconnects.. perform this
    /*socket.on('disconnect', () => {
        if (addedUser) {
            --numUsers;

            // echo globally that this client has left
            socket.broadcast.emit('user left', {
                username: socket.username,
                numUsers: numUsers
            });
        }
    });*/
});

http.listen(3000, function () {
    console.log('Servidor activo > listening on *:3000');
});