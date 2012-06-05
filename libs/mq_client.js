/*
* Message Queue Client
* Publisher 
* Subscriber
*/


//var mqtt = require('mqttjs');
var io = require('socket.io-client');
var config = require('../config.js').config;

//var port = config.message_queue.port;
var port = config.port;
var host = config.message_queue.host;

function publish(topic, payload) {
    var socket = io.connect('http://'+host+':'+port);
    socket.emit('publish', {topic:topic, payload:payload});
};

function subscribe(topic, cb) {
    var socket = io.connect('http://'+host+':'+port);
    socket.on('connect', function() {
        socket.emit('subscribe', {topic:topic});
    });
    
    socket.on(topic, cb);
};

exports.pub = publish;
exports.sub = subscribe;