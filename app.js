var express = require('express'),
  config = require('./config/config');

var app = express();

require('./config/express')(app, config);

app.use(function (req, res, next) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', '*');
    res.setHeader('Access-Control-Allow-Headers', '*');
    res.setHeader('Access-Control-Allow-Credentials', false);
    next();
});


app.listen(config.port, function () {
  console.log('Express server listening on port ' + config.port);
});

console.log(config.port);
var server = require('http').createServer(app);
var io = require('socket.io')(server);
var shortid = require('shortid');
var players = [];

console.dir(io);

io.on('connection', (socket) => {
    
    var thisPlayerId = shortid.generate();
    var player = {
        id: thisPlayerId,
        x: 0,
        y: 0
    };

    players[thisPlayerId] = player;
    console.log('client connected, broadcasting spawn, id: ', thisPlayerId);

    socket.emit('register', { id: thisPlayerId });
    socket.broadcast.emit('spawn', { id: thisPlayerId });
    socket.broadcast.emit('requestPosition');

    for (var playerId in players) {
        if (playerId == thisPlayerId) {
            continue;
        }
        socket.emit('spawn', players[playerId]);
        console.log('sending spawn to new player for id: ', playerId);

    }

    socket.on('move', (data) => {
        data.id = thisPlayerId;
        console.log('client moved', JSON.stringify(data));
        player.x = data.x;
        player.y = data.y;
        socket.broadcast.emit('move', data);
    });

    socket.on('follow', (data) => {
        console.log('follow request', data);
        data.id = thisPlayerId;
        socket.broadcast.emit('follow', data);
    });


    socket.on('updatePosition', (data) => {
        console.log('update position', data);
        data.id = thisPlayerId;
        socket.broadcast.emit('updatePosition', data);
    });

    socket.on('disconnect', () => {
        console.log('client id ', thisPlayerId, ' disconnected');
        delete players[thisPlayerId];
        socket.broadcast.emit('disconnected', { id: thisPlayerId });
    });
})
