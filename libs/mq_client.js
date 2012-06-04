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
//    var socket = io.connect('/');
    socket.on('connect', function() {
        console.log('publish connect');
//        socket.emit('publish', {topic:topic, payload:payload});
    });
    socket.emit('publish', {topic:topic, payload:payload});
/*    mqtt.createClient(port, host, function(client) {
        client.connect({keepalive: 3000, client:"mqtt_pub"});
    
        client.on('connack', function(packet) {
            if (packet.returnCode === 0) {
              client.publish({topic: topic, payload: payload});
              client.disconnect();
            } else {
              console.log('connack error %d', packet.returnCode);
              //process.exit(-1);
            }
        });
    
        client.on('close', function() {
        //    process.exit(0);
        });
    
        client.on('error', function(e) {
            console.log('error %s', e);
         //   process.exit(-1);
        });
    });  */
};

function subscribe(topic, cb) {
    var socket = io.connect('http://'+host+':'+port);
//    var socket = io.connect('/');
    socket.on('connect', function() {
        console.log('subscribe connect');
        socket.emit('subscribe', {topic:topic});
    });
    
    socket.on(topic, cb);
/*    mqtt.createClient(port, host, function(client) {
        client.connect({keepalive: 3000, client:"mqtt_sub_"+Math.floor(65535 * Math.random())});
        client.on('connack', function(packet) {
            if (packet.returnCode === 0) {
                client.subscribe({topic: topic});
            } else {
                console.log('connack error %d', packet.returnCode);
            //    process.exit(-1);
            }
        });
                
        client.on('publish', function(packet) {
            console.log('%s\t%s', packet.topic, packet.payload);
            cb(packet.payload);
        });
    
        client.on('close', function() {
    //        process.exit(0);
        });
    
        client.on('error', function(e) {
                console.log('error %s', e);
    //            process.exit(-1);
        });
    });*/
};

exports.pub = publish;
exports.sub = subscribe;