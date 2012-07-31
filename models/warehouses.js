var mysql = require('../libs/mysql.js');
var SimpleDO = require('../libs/simpleDO');

function createWarehouse() {
    return new Warehouse();
};

function Warehouse() {
    this.table = '`ef_warehouse`';
};
Warehouse.prototype = new SimpleDO('`ef_warehouse`');
Warehouse.prototype.create = function(name, cb) {
    var opt = {
        table: 'ef_warehouse',
        fields: {'name':name+'仓库'}
    };
    mysql.insert(opt, function(err, info) {
        if(err) return next(err);
        else {
            return cb(err, info);
        }
    });
};

//Warehouse.prototype.findOne = function(opt, cb) {
//    options = {schema:this.table, querys:opt};
//    mysql.findOne(options, cb);
//};

Warehouse.prototype.findAll = function(opt, cb) {
    options = {schema:this.table, querys:opt};
    mysql.find(options, cb);
};

Warehouse.prototype.count = function(opt, cb) {
    var sql = "SELECT COUNT(*) AS count FROM ef_warehouse where 1=1 "
        +opt.where;
    //if(opt.bt) sql += " and create_time >= "+ opt.bt;
    //if(opt.et) sql += " and create_time <= "+ opt.et;

    mysql.query(sql, function(err, rs) {
        if(err) return cb(err);
        if(!rs.length) return cb(err);
        cb(err, rs[0]);
    });
};

Warehouse.prototype.findAllData = function(opt, cb) {
    var sql = " SELECT * FROM ef_warehouse  "
        +" where 1=1 "+ opt.where;
    //if(opt.bt) sql += " and create_time >= "+ opt.bt;
    //if(opt.et) sql += " and create_time <= "+ opt.et;
    if(opt.sidx && opt.sord) sql += " ORDER BY "+opt.sidx+" "+opt.sord;
    if(opt.limit && opt.start) sql += " LIMIT "+ opt.start + " , "+opt.limit;
    mysql.query(sql, function(err, rs) {
        if(err) return cb(err);
        if(!rs.length) return cb(err);
        cb(err, rs);
    });
};

Warehouse.prototype.delete = function(ids, cb) {
    var sql = " delete from ef_warehouse where _id in(" + ids + ") ";
    mysql.query(sql, function(err, rs) {
        if(err) return cb(err);
        cb(err, rs);
    });
};

exports = module.exports = createWarehouse;
