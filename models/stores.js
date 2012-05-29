var mysql = require('../libs/mysql.js');

function createStore() {
    return new Store();
};

function Store() {
    this.table = '`ef_store`';
};

Store.prototype.findAll = function(sidx, sord, cb) {
    var sql = "SELECT s._id _id, s.name name, m.short_name merchant_name, w.name warehouse_name, s.state state, s.create_time create_time "
        +"FROM ef_store s, ef_merchant m, ef_warehouse w "
        +"where s.merchant_id = m._id and s.warehouse_id = w._id  ORDER BY "+sidx+" "+sord;
    mysql.query(sql, function(err, rs) {
        if(err) return cb(err);
        if(!rs.length) return cb(err);
        cb(err, rs);
    });
};

Store.prototype.count = function(cb) {
    var sql = "SELECT COUNT(*) AS count FROM `ef_store`";
    mysql.query(sql, function(err, rs) {
        if(err) return cb(err);
        if(!rs.length) return cb(err);
        cb(err, rs);
    });
};

Store.prototype.create = function(body, cb) {
    var opt = {
        table: 'ef_store',
        fields: body
    };
    mysql.insert(opt, function(err, info) {
        if(err) return next(err);
        else {
            return cb(err, info);
        }
    });
};

exports = module.exports = createStore;