var mysql = require('../libs/mysql.js');
var SimpleDO = require('../libs/simpleDO');

function createMerchant() {
    return new Merchant();
};

function Merchant() {
    this.table = 'ef_merchant';
};
Merchant.prototype = new SimpleDO('ef_merchant');

Merchant.prototype.findGoods = function(query, cb) {
    var sql = "SELECT g.* FROM ef_goods AS g, ef_merchant_goods AS mg "+
              "WHERE g._id = mg.goods_id AND mg.merchant_id = "+query.merchant_id;
    mysql.query(sql, function(err, rs) {
       if(err || !rs.length) return cb(err);
       cb(err, rs);
    });
};

Merchant.prototype.save = function(obj, cb) {
    console.log("Merchant Save``````````````````");
};

Merchant.prototype.findOne = function(opt, cb) {
    var sql = "SELECT * FROM `ef_merchant` WHERE `_id` = '"+opt._id+"'";
    mysql.query(sql, function(err, rs) {
        if(err) return cb(err);
        if(!rs.length) return cb(err);
        cb(err, rs[0]);
    });
};

/*
Merchant.prototype.findAll = function(sidx, sord, cb) {
    var sql = "SELECT _id, short_name, state, type, phone, create_time, due_time FROM `ef_merchant`";
    if(sidx != null && sord != null){
        sql += " ORDER BY "+sidx+" "+sord;
    }else{
        sql += " ORDER BY create_time desc ";
    }
    mysql.query(sql, function(err, rs) {
        if(err) return cb(err);
        if(!rs.length) return cb(err);
        cb(err, rs);
    });
};
*/
Merchant.prototype.findAll = function(opt, cb) {
//    var sql = " SELECT * FROM ef_merchant  "
//        +" where 1=1 ";
//    if(opt.where){
//        sql += opt.where;
//    }
//    if(opt.sidx && opt.sord){
//        sql += " ORDER BY "+opt.sidx+" "+opt.sord;
//    }
//    if(opt.start && opt.limit){
//        sql += " LIMIT "+ opt.start + " , "+opt.limit;
//    }
//    mysql.query(sql, function(err, rs) {
//        if(err) return cb(err);
//        if(!rs.length) return cb(err);
//        cb(err, rs);
//    });
    var sql = " SELECT * FROM ef_merchant  "
        +" where 1=1 "+ opt.where;
    if(opt.bt) sql += " and create_time >= "+ opt.bt;
    if(opt.et) sql += " and create_time <= "+ opt.et;
    if(opt.sidx && opt.sord) sql += " ORDER BY "+opt.sidx+" "+opt.sord;
    if(opt.limit && opt.start) sql += " LIMIT "+ opt.start + " , "+opt.limit;
    mysql.query(sql, function(err, rs) {
        if(err) return cb(err);
        if(!rs.length) return cb(err);
        return cb(err, rs);
    });
};

Merchant.prototype.create = function(body, cb) {
    var opt = {
        table: 'ef_merchant',
        fields: body
    };
    mysql.insert(opt, function(err, info) {
        if(err) return next(err);
        else {
            return cb(err, info);
        }
    });
};

/*
 var sql =  'INSERT INTO `ef_merchant` '+
 'SET short_name = ?, state = ?, type = ?, phone = ?, create_time = ?, due_time = ? ';
 mysql.query(sql, ['super cool', 'this is a nice text', '2010-08-16 10:00:23']);
 */

//Merchant.prototype.count = function(cb) {
//    var sql = "SELECT COUNT(*) AS count FROM `ef_merchant`";
//    mysql.query(sql, function(err, rs) {
//        if(err) return cb(err);
//        if(!rs.length) return cb(err);
//        cb(err, rs);
//    });
//};

Merchant.prototype.count = function(opt, cb) {

    var sql = "SELECT COUNT(*) AS count FROM ef_merchant where 1=1 "
        +opt.where;
    if(opt.bt) sql += " and create_time >= '"+ opt.bt + "' ";
    if(opt.et) sql += " and create_time <= '"+ opt.et + "' ";

    mysql.query(sql, function(err, rs) {
        if(err) return cb(err);
        if(!rs.length) return cb(err);
        return cb(err, rs[0]);
    });
};

Merchant.prototype.delete = function(ids, cb) {
    var sql = " delete from ef_merchant where _id in(" + ids + ") ";
    mysql.query(sql, function(err, rs) {
        if(err) return cb(err);
        cb(err, rs);
    });
};

Merchant.prototype.update = function(body, cb) {	
    var opt = {
        table: 'ef_merchant',
        fields: body
    };
    mysql.update(opt, function(err, info) {
        if(err) return cb(err);
        cb(err, info);
    });
};

exports = module.exports = createMerchant;