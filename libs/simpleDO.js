var mysql = require('../libs/mysql.js');

function SimpleDO(schema) {
    this.schema = schema||'';
};

/**
    查询一个数据对象
    querys：查询条件以对象形式出现，例如：{_id:123}
    cb：回调函数，在查询完成后异步执行返回结果。
*/
SimpleDO.prototype.findOne = function(query, cb) {
    options = {schema:this.schema, query:query};
    mysql.findOne(options, cb);
};

/**
    查询一批数据对象
    querys：查询条件以对象形式出现，例如：{_id:123, field: { $lt: value }}
    cb：回调函数，在查询完成后异步执行返回结果。
*/
SimpleDO.prototype.find = function(query, cb) {
    options = {schema:this.schema, query:query};
    mysql.find(options, cb);    
};

exports = module.exports = SimpleDO;