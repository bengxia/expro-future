var mysql = require('../libs/mysql.js');

function createWarehouseWarrant() {
    return new WarehouseWarrant();
};

function WarehouseWarrant() {
    this.table = '`ef_warehouse_warrant`';
};

/**
* 以对象形式传递查询条件参数
*/
WarehouseWarrant.prototype.findOne = function(opt, cb) {
    options = {schema:this.table, querys:opt};
    mysql.findOne(options, cb);
};

WarehouseWarrant.prototype.findAll = function(opt, cb) {
    options = {schema:this.table, querys:opt};
    mysql.findAll(options, cb);    
};

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
    options = {schema:'`ef_warehouse_warrant_item`', querys:opt};
    mysql.findAll(options, cb);    
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

exports = module.exports = createWarehouseWarrant;