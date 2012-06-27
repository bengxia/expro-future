var mysql = require('../libs/mysql.js');

function createWarehouse() {
    return new Warehouse();
};

function Warehouse() {
    this.table = '`ef_warehouse`';
};

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

Warehouse.prototype.findOne = function(opt, cb) {
    options = {schema:this.table, querys:opt};
    mysql.findOne(options, cb);
};

exports = module.exports = createWarehouse;
