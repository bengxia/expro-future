/*!
 * nodeclub - app.js
 */

/**
 * Module dependencies.
 */

var Log = require('./log.js');
var log = Log.create(Log.INFO, {'file':'public/node.debug'});


var path = require('path');
var express = require('express');
var routes = require('./routes');
var config = require('./config').config;

var RedisStore = require('connect-redis')(express);
var app = express.createServer();
//message queue
require('./libs/mq_server.js')(app);


// configuration in all env
app.configure(function() {
	var viewsRoot = path.join(__dirname, 'views');
        app.set('view engine', 'jade');
	app.set('views', viewsRoot);
	app.use(express.bodyParser());
	app.use(express.cookieParser());
	app.use(express.session({
                store: new RedisStore({host:config.redis.host}),
		secret: config.session_secret,
                cookie: config.session_cookie
	}));
        app.use(express.methodOverride());
	// custom middleware
	app.use(require('./controllers/sign').auth_user);

        var csrf = express.csrf();
/*	app.use(function(req, res, next){
            //ignore some route
            if(req.url == '/signin') return next();
            if(req.url == '/deals/40') return next();
            if(req.url == '/deals') return next();
            csrf(req, res, next);
        });            */

	// plugins
	var plugins = config.plugins || [];
	for (var i = 0, l = plugins.length; i < l; i++) {
		var p = plugins[i];
		app.use(require('./plugins/' + p[0])(p[1]));
	}
});

// set static, dynamic helpers
app.helpers({
	config: config
});
app.dynamicHelpers({
	csrf: function(req,res) {
		return req.session ? req.session._csrf : '';
	},
});

var static_dir = path.join(__dirname, 'public');
app.configure('development', function(){
	app.use(express.static(static_dir));
	app.use(express.errorHandler({ dumpExceptions: true, showStack: true })); 
});

app.configure('production', function(){
	var maxAge = 3600000 * 24 * 30;
	app.use(express.static(static_dir, { maxAge: maxAge }));
	app.use(express.errorHandler()); 
	app.set('view cache', true);
});

// routes
routes(app);


app.listen(config.port);
//log.info("ExproFuture listening on port %d in %s mode", app.address().port, app.settings.env);
log.info("ExproFuture listening on port %d in %s mode", config.port, app.settings.env);
