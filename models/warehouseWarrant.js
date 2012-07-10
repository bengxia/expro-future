var mysql = require('../libs/mysql.js');
var SimpleDO = require('../libs/simpleDO');

function createWarehouseWarrant() {
    return new WarehouseWarrant();
};

function WarehouseWarrant() {
};
WarehouseWarrant.prototype = new SimpleDO('`ef_warehouse_warrant`');

WarehouseWarrant.prototype.findAllData = function(opt, cb) {
    var sql = " SELECT * FROM ef_warehouse_warrant  "
        +" where 1=1 "+ opt.where;
    if(opt.bt) sql += " and create_time >= "+ opt.bt;
    if(opt.et) sql += " and create_time <= "+ opt.et;
    if(opt.sidx && opt.sord) sql += " ORDER BY "+opt.sidx+" "+opt.sord;
    if(opt.limit && opt.start) sql += " LIMIT "+ opt.start + " , "+opt.limit;
    mysql.query(sql, function(err, rs) {
        if(err) return cb(err);
        if(!rs.length) return cb(err);
        cb(err, rs);
    });
};

WarehouseWarrant.prototype.findItems = function(opt, cb) {
    options = {schema:'`ef_warehouse_warrant_item`', query:opt};
    mysql.find(options, cb);    
};

WarehouseWarrant.prototype.count = function(opt, cb) {
    var sql = "SELECT COUNT(*) AS count FROM ef_warehouse_warrant where 1=1 "
        +opt.where;
    if(opt.bt) sql += " and create_time >= "+ opt.bt;
    if(opt.et) sql += " and create_time <= "+ opt.et;

    mysql.query(sql, function(err, rs) {
        if(err) return cb(err);
        if(!rs.length) return cb(err);
        cb(err, rs[0]);
    });
};

WarehouseWarrant.prototype.create = function(body, cb) {
    var opt = {
        table: 'ef_warehouse_warrant',
        fields: body
    };
    mysql.insert(opt, function(err, info) {
        cb(err, info);
    });
};

WarehouseWarrant.prototype.delete = function(ids, cb) {
    var sql = " delete from ef_warehouse_warrant where _id in(" + ids + ") ";
    mysql.query(sql, function(err, rs) {
        if(err) return cb(err);
        cb(err, rs);
    });
};

exports = module.exports = createWarehouseWarrant;