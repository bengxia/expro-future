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
    
    ep.assign('merchant', 'store', 'member', 'goods_type', 'goods', 'role', function() {
        //console.log(arguments);
        Array.prototype.slice.apply(arguments).forEach(function(item) {
//            console.log(item);
            if(item.store) 
                json.sync_merchant.store = item.store;
            else if(item.member) 
                json.sync_merchant.member = item.member;
            else if(item.goods) 
                json.sync_merchant.goods = item.goods;
/*            else if(item.goods_type) 
                json.sync_merchant.goods_type = item.goods_type;
            else if(item.role) 
                json.sync_merchant.role = item.role;*/
        });
        return res.json(json);
    });
    
    Merchant.findOne({_id:id}, function(err, merchant) {
        if(err) return next(err);
        if(!merchant) return ep.trigger('error', {status:404});
        json.sync_merchant = merchant;
        ep.trigger('merchant', {});
    });
    Store.find({merchant_id:id}, function(err, stores) {
        if(err) return next(err);
        ep.after('store_staff', stores.length, function(){
            ep.trigger('store', {store:stores});
        });
        stores.forEach(findStoreStaff);
    });
    function findStoreStaff(store) {
        Store.findStaff({store_id:store._id}, function(err, staffs) {
            if(err) return next(err);
            store.staff = staffs;
            ep.trigger('store_staff', staffs);
        });    
    };
    Member.find({org_id:id}, function(err, members) {
        if(err) return next(err);
        ep.after('user', members.length, function() {
            ep.trigger('member', {member:members});
        });
        members.forEach(findMemberUser);
    });
    function findMemberUser(member) {
        User.findOne({_id:member.user_id}, function(err, user) {
            if(err) return next(err);
            member.user = user;
            ep.trigger('user', user);
        });
    };
    GoodsType.find(function(err, goodsTypes) {
        if(err) return next(err);
        json.goods_type = goodsTypes;
        ep.trigger('goods_type', {goods_type:goodsTypes});
    });
    Merchant.findGoods({merchant_id:id}, function(err, goods) {
        if(err) return next(err);
        ep.trigger('goods', {goods:goods});
    });
    Role.find(function(err, roles) {
        if(err) return next(err);
        ep.after('role_route', roles.length, function() {
            json.role = roles;
            ep.trigger('role', {role:roles});
        });
        roles.forEach(findRoleRoute);
    });
    function findRoleRoute(role) {
        Role.findRoute({_id:role._id}, function(err, routes) {
            role.route = routes;
            ep.trigger('role_route', routes);
        })
    };
};

exports.store = function(req, res, next) {
    var id = parseInt(sanitize(req.params.id).trim());
    var ep = EventProxy.create();
    var json = {sync_store:{_id:id}};

    ep.once('error', function(result) {
        ep.unbind();
        return res.send(result.status);
    });
    console.log("--------");
    Store.findOne({_id:id}, function(err, store) {
        console.log("---store："+store);
        if(err) return next(err);
        if(!store) return ep.trigger('error', {status:404});
        getWarehouse(store);
    });
    
    function getWarehouse(store) {
        console.log("---getWarehouse");
        Warehouse.findOne({_id:store.warehouse_id}, function(err, warehouse) {
            if(err) return next(err);
            if(!warehouse) return ep.trigger('error', {status:404});
            json.sync_store.warehouse = warehouse;
            getWarrants(warehouse);
        });
    };
    
    function getWarrants(warehouse) {
        console.log("---getWarrants");
        WarehouseWarrant.find({recipient_id:warehouse._id}, function(err, warehouseWarrants) {
            if(err) return next(err);
            if(warehouseWarrants.length > 0) warehouse.stock_in = warehouseWarrants;
            ep.after('stockIn', warehouseWarrants.length, function() {
                ep.trigger('stockIns');
            });
            warehouseWarrants.forEach(function(warrant) {
                WarehouseWarrant.findItems({warehouse_warrant_id:warrant._id}, function(err, warehouseWarrantItems) {
                    if(err) return next(err);
                    if(warehouseWarrantItems.length > 0) warrant.item = warehouseWarrantItems;
                    ep.trigger('stockIn', warehouseWarrantItems);
                });
            });
        });
        WarehouseWarrant.find({source_id:warehouse._id}, function(err, warehouseWarrants) {
            if(err) return next(err);
            if(warehouseWarrants.length > 0) warehouse.stock_out = warehouseWarrants;
            ep.after('stockOut', warehouseWarrants.length, function() {
                ep.trigger('stockOuts');
            });
            warehouseWarrants.forEach(function(warrant) {
                WarehouseWarrant.findItems({warehouse_warrant_id:warrant._id}, function(err, warehouseWarrantItems) {
                    if(err) return next(err);
                    if(warehouseWarrantItems.length > 0) warrant.item = warehouseWarrantItems;
                    ep.trigger('stockOut', warehouseWarrantItems);
                });
            });
        });
    };
    
    ep.assign('stockIns', 'stockOuts', function() {
        feedback();
    });
    
    function feedback() {
        return res.json(json);
    }
}
