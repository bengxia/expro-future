var models = require('../models');
var Merchant = models.Merchant;
var Store = models.Store;
var Member = models.Member;
var User = models.User;
var GoodsType = models.GoodsType;
var Goods = models.Goods;
var Role = models.Role;

var check = require('validator').check,
    sanitize = require('validator').sanitize;
var EventProxy = require('eventproxy').EventProxy;
var Log = require('../log.js');
var log = Log.create(Log.INFO, {'file':'public/node.debug'});
var MQClient = require('../libs/mq_client.js');

exports.merchant = function(req, res, next) {
    if(req.accepts('json')) {
        var json = {};
        var id = parseInt(sanitize(req.params.id).trim());
        var ep = EventProxy.create();
        
        ep.once('error', function(result) {
            ep.unbind();
            return res.send(result.status);
        });
        
        ep.assign('merchant', 'store', 'member', 'store_staff', 
        'user', 'goods_type', 'goods', 'role', 'route_table', 
        function(merchant, store, member, store_staff, user, 
        goods_type, goods, role, route_table) {
            merchant.store = store;
            merchant.member = member;
            merchant.store_staff = store_staff;
            merchant.user = user;
            merchant.goods_type = goods_type;
            merchant.goods = goods;
            merchant.role = role;
            merchant.route_table = route_table;
            json.sync_merchant = merchant;
            return res.json(json);
        });
        
        Merchant.findOne({_id:id}, function(err, merchant) {
            if(err) return next(err);
            if(!merchant) return ep.trigger('error', {status:404});
            console.log(merchant);
            ep.trigger('merchant', merchant);
        });
        Store.findAllBy({merchant_id:id}, function(err, stores) {
            if(err) return next(err);
            console.log(stores);
            ep.trigger('store', stores);
            ep.trigger('member', stores);
            ep.trigger('store_staff', stores);
            ep.trigger('user', stores);
            ep.trigger('goods_type', stores);
            ep.trigger('goods', stores);
            ep.trigger('role', stores);
            ep.trigger('route_table', stores);
        });
    }
    else res.send(406);
};