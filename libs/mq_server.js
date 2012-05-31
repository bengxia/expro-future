/*
* Message Queue Service
*/

var mqtt = require('mqttjs');
var util = require('util');
var config = require('../config.js').config;

var mqServer = mqtt.createServer(function(client) {
	var self = this;

	if (!self.clients) self.clients = {};
	client.on('connect', function(packet) {
		self.clients[packet.client] = client;
		client.id = packet.client;
		client.subscriptions = [];
		client.connack({returnCode: 0});
	});

	client.on('subscribe', function(packet) {
		var granted = [];

		for (var i = 0; i < packet.subscriptions.length; i++) {
			var qos = packet.subscriptions[i].qos,
				topic = packet.subscriptions[i].topic,
				reg = new RegExp(topic.replace('+', '[^\/]+').replace('#', '.+$'));

			granted.push(qos);
			client.subscriptions.push(reg);
		}

		client.suback({messageId: packet.messageId, granted: granted});
	});

	client.on('publish', function(packet) {
                console.log('Server Publish:', packet);
		for (var k in self.clients) {
			var c = self.clients[k],
				publish = false;

			console.log('%s, subscription.length',k, c.subscriptions.length);
                        for (var i = 0; i < c.subscriptions.length; i++) {
				var s = c.subscriptions[i];

				console.log(s);
                                if (s.test(packet.topic)) {
					publish = true;
				}
			}

			if (publish) {
			    c.publish({topic: packet.topic, payload: packet.payload});
			}
		}
	});

	client.on('pingreq', function(packet) {
		client.pingresp();
	});

	client.on('disconnect', function(packet) {
		client.stream.end();
	});

	client.on('close', function(packet) {
		delete self.clients[client.id];
	});

	client.on('error', function(e) {
		client.stream.end();
		console.log(e);
	});
}).listen(config.message_queue.port);

console.log('Message Queue Listen On %d', mqServer.address().port);