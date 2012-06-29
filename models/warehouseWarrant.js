var mysql = require('../libs/mysql.js');
var SimpleDO = require('../libs/simpleDO');

function createWarehouseWarrant() {
    return new WarehouseWarrant();
};

function WarehouseWarrant() {
};
WarehouseWarrant.prototype = new SimpleDO('`ef_warehouse_warrant`');

WarehouseWarrant.prototype.findItems = function(opt, cb) {
    options = {schema:'`ef_warehouse_warrant_item`', query:opt};
    mysql.find(options, cb);    
};

exports = module.exports = createWarehouseWarrant;