var mysql = require('../libs/mysql.js');
var SimpleDO = require('../libs/simpleDO');

function createWarehouse() {
    return new Warehouse();
};

function Warehouse() {
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

exports = module.exports = createWarehouse;
