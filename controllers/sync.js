var models = require('../models');
var Merchant = models.Merchant;
var Store = models.Store;
var Member = models.Member;
var User = models.User;
var GoodsType = models.GoodsType;
var Goods = models.Goods;
var Role = models.Role;
var Warehouse = models.Warehouse;
var WarehouseWarrant = models.WarehouseWarrant;

var check = require('validator').check,
    sanitize = require('validator').sanitize;
var EventProxy = require('eventproxy').EventProxy;
var Log = require('../log.js');
var log = Log.create(Log.INFO, {'file':'public/node.debug'});
var MQClient = require('../libs/mq_client.js');

exports.restrict = function(req, res, next) {
    if(req.accepts('json')) next();
    else res.send(406);
}

exports.merchant = function(req, res, next) {
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
        ep.trigger('store', stores);
    });
    Member.findAllBy({org_id:id}, function(err, members) {
        if(err) return next(err);
        ep.trigger('member', members);
    });
    Store.findAllBy({org_id:id}, function(err, staffs) {
        if(err) return next(err);
        ep.trigger('store_staff', staffs);
    });
    User.findAllBy({org_id:id}, function(err, Users) {
        if(err) return next(err);
        ep.trigger('user', Users);
    });
    GoodsType.findAllBy({org_id:id}, function(err, goodsTypes) {
        if(err) return next(err);
        ep.trigger('goods_type', goodsTypes);
    });
    Goods.findAllBy({org_id:id}, function(err, goods) {
        if(err) return next(err);
        ep.trigger('goods', goods);
    });
    Role.findAllBy({org_id:id}, function(err, roles) {
        if(err) return next(err);
        ep.trigger('role', roles);
    });
    Route.findAllBy({org_id:id}, function(err, routes) {
        if(err) return next(err);
        ep.trigger('route_table', routes);
    });
};

exports.store = function(req, res, next) {
    var id = parseInt(sanitize(req.params.id).trim());
    var ep = EventProxy.create();
    var json = {sync_store:{_id:id}};
    
    ep.once('error', function(result) {
        ep.unbind();
        return res.send(result.status);
    });
    
    Store.findOneBy({_id:id}, function(err, store) {
        if(err) return next(err);
        if(!store) return ep.trigger('error', {status:404});
        getWarehouse(store);
    });
    
    function getWarehouse(store) {
        Warehouse.findOne({_id:store.warehouse_id}, function(err, warehouse) {
            if(err) return next(err);
            if(!warehouse) return ep.trigger('error', {status:404});
            json.sync_store.warehouse = warehouse;
            getWarrants(warehouse);
        });
    };
    
    function getWarrants(warehouse) {
        WarehouseWarrant.findAll({recipient_id:warehouse._id}, function(err, warehouseWarrants) {
            if(err) return next(err);
            if(warehouseWarrants.length > 0) warehouse.warrant = warehouseWarrants;
            ep.after('warehouseWarrant', warehouseWarrants.length, function() {
                feedback();
            });
            warehouseWarrants.forEach(function(warrant) {
                WarehouseWarrant.findItems({warehouse_warrant_id:warrant._id}, function(err, warehouseWarrantItems) {
                    if(err) return next(err);
                    if(warehouseWarrantItems.length > 0) warrant.item = warehouseWarrantItems;
                    ep.trigger('warehouseWarrant', warehouseWarrantItems);
                });
            });
        });
    };
    
    function feedback() {
        return res.json(json);
    }
}
