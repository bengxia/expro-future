var mysql = require('../libs/mysql.js');

function createMerchant() {
    return new Merchant();
};

function Merchant() {
    this.table = '`ef_merchant`';
};

Merchant.prototype.save = function(obj, cb) {
    console.log("Merchant Save``````````````````");
};

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

Merchant.prototype.count = function(cb) {
    var sql = "SELECT COUNT(*) AS count FROM `ef_merchant`";
    mysql.query(sql, function(err, rs) {
        if(err) return cb(err);
        if(!rs.length) return cb(err);
        cb(err, rs);
    });
};

exports = module.exports = createMerchant;