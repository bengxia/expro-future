var mysql = require('../libs/mysql.js');

function createStore() {
    return new Store();
};

function Store() {
    this.table = '`ef_store`';
};

Store.prototype.findAll = function(cb) {
    var sql = "SELECT * FROM `ef_user`";
    mysql.query(sql, function(err, rs) {
        if(err) return cb(err);
        if(!rs.length) return cb(err);
        cb(err, rs);
    });
};

exports = module.exports = createStore;