var mysql = require('../libs/mysql.js');

function createStore() {
    return new Store();
};

function Store() {
    this.table = '`ef_store`';
};

Store.prototype.findAll = function(where, start, limit, sidx, sord, cb) {
    var sql = " SELECT store._id _id, store.name name, merchant.short_name merchant_name, warehouse.name warehouse_name, store.state state, store.create_time create_time "
        +" FROM ef_store store, ef_merchant merchant, ef_warehouse warehouse "
        +" where store.merchant_id = merchant._id and store.warehouse_id = warehouse._id  "+ where
        +" ORDER BY "+sidx+" "+sord
        +" LIMIT "+ start + " , "+limit;
    //console.log('sql:  '+sql);
    mysql.query(sql, function(err, rs) {
        if(err) return cb(err);
        if(!rs.length) return cb(err);
        cb(err, rs);
    });
};

Store.prototype.findOne = function(opt, cb) {
    var sql = " SELECT store._id _id, store.name name, merchant.short_name merchant_name, warehouse.name warehouse_name, store.state state, store.create_time create_time "
        +" FROM ef_store store, ef_merchant merchant, ef_warehouse warehouse "
        +" where store.merchant_id = merchant._id and store.warehouse_id = warehouse._id  and store._id="+ opt._id;
    //console.log('sql:  '+sql);
    mysql.query(sql, function(err, rs) {
        if(err) return cb(err);
        if(!rs.length) return cb(err);
        cb(err, rs[0]);
    });
};

Store.prototype.count = function(where, cb) {
    var sql = "SELECT COUNT(*) AS count FROM ef_store store where 1=1 "+where;
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

Store.prototype.delete = function(ids, cb) {
    var sql = " delete from ef_store where _id in(" + ids + ") ";
    mysql.query(sql, function(err, rs) {
        if(err) return cb(err);
        //if(!rs.length) return cb(err);
        cb(err, rs);
    });
};

exports = module.exports = createStore;