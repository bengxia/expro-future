/*var tag_ctrl = require('./tag');
var user_ctrl = require('./user');
var topic_ctrl = require('./topic');
var config = require('../config').config;
var EventProxy = require('eventproxy').EventProxy;

var sanitize = require('validator').sanitize;
*/

exports.index = function(req,res,next){
    res.render('index');
//    res.redirect('/signin');
};
