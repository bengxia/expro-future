/*
* Message Queue Service
*/
var redis = require('redis');
var config = require('../config').config;

exports = module.exports = function(app) {
    var sio = require('socket.io').listen(app);
    var RedisStore = require('socket.io/lib/stores/redis');
    var pub    = redis.createClient(config.redis.port, config.redis.host);
    var sub    = redis.createClient(config.redis.port, config.redis.host);
    var client = redis.createClient(config.redis.port, config.redis.host);
    
    sio.set('store', new RedisStore({
        redisPub : pub,
        redisSub : sub,
        redisClient : client
    }));    
    sio.set('log level', 0);
    
    sio.sockets.on('connection', function (socket) {
        socket.on('subscribe', function(data) { 
            socket.join(data.topic); 
        });
        
        socket.on('publish', function(data) {
//            socket.broadcast.to(data.topic).emit('publish');
//            socket.broadcast.to(data.topic).json.send(data);
            sio.sockets.in(data.topic).emit(data.topic, data.payload);
        });
    });
};