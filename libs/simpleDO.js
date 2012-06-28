var mysql = require('../libs/mysql.js');

function SimpleDO(schema) {
    this.schema = schema||'';
};

SimpleDO.prototype.findOne = function(opt, cb) {
    options = {schema:this.schema, querys:opt};
    mysql.findOne(options, cb);
};

SimpleDO.prototype.findAll = function(opt, cb) {
    options = {schema:this.table, querys:opt};
    mysql.findAll(options, cb);    
};

exports = module.exports = SimpleDO;