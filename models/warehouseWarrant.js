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

WarehouseWarrant.prototype.findItems = function(opt, cb) {
    options = {schema:'`ef_warehouse_warrant_item`', querys:opt};
    mysql.findAll(options, cb);    
};

exports = module.exports = createWarehouseWarrant;