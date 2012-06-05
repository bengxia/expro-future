var mysql = require('../libs/mysql.js');

function createStore() {
    return new Store();
};

function Store() {
    this.table = '`ef_store`';
};

/**
 * 根据条件查询表中所有的门店数据
 * @param where 页面传入的查询条件
 * @param start 开始页数
 * @param limit 每页的显示数据条数
 * @param sidx 排序的列名
 * @param sord 升序&降序
 * @param cb 回调
 */
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

/**
 * 查询指定门店，编辑时使用。
 * @param opt 包含_id属性
 * @param cb
 */
Store.prototype.findOne = function(opt, cb) {
    /*
     _id
     inventar_num       资产编号
     name
     warehouse_id       仓库
     merchant_id        所属商户
     state
     district_code      国家-省-市-区编号
     address
     transit_info       公交说明
     map_info
     notice             门店公告
     create_time
     comment
     */
    var sql = " SELECT store._id _id, store.inventar_num inventar_num, store.name name, store.warehouse_id warehouse_id, store.merchant_id merchant_id, warehouse.name warehouse_name, "
        +"merchant.short_name merchant_name, store.state state, store.district_code district_code, store.address address, "
        +"store.transit_info transit_info, store.map_info map_info, store.notice notice, store.create_time create_time, store.comment comment "
        +" FROM ef_store store, ef_merchant merchant, ef_warehouse warehouse "
        +" where store.merchant_id = merchant._id and store.warehouse_id = warehouse._id  and store._id="+ opt._id;
    //console.log('sql:  '+sql);
    mysql.query(sql, function(err, rs) {
        if(err) return cb(err);
        if(!rs.length) return cb(err);
        cb(err, rs[0]);
    });
};

/**
 * 根据条件获得数据的行数
 * @param where 页面传入的查询条件
 * @param cb 回调
 */
Store.prototype.count = function(where, cb) {
    var sql = "SELECT COUNT(*) AS count FROM ef_store store where 1=1 "+where;
    mysql.query(sql, function(err, rs) {
        if(err) return cb(err);
        if(!rs.length) return cb(err);
        cb(err, rs);
    });
};

/**
 * 创建门店
 * @param body 前台传入的页面提交数据对象
 * @param cb 回调
 */
Store.prototype.create = function(body, cb) {
    var opt = {
        table: 'ef_store',
        fields: body
    };
    mysql.insert(opt, function(err, info) {
        if(err) return next(err);
        return cb(err, info);
    });
};

/**
 * 删除一批门店
 * @param ids 门店的序号，可以为多个以','号分隔，例如：01,02,03
 * @param cb 回调
 */
Store.prototype.delete = function(ids, cb) {
    var sql = " delete from ef_store where _id in(" + ids + ") ";
    mysql.query(sql, function(err, rs) {
        if(err) return cb(err);
        cb(err, rs);
    });
};

/**
 * 更新商户门店信息
 * @param body
 * @param cb
 */
Store.prototype.update = function(body, cb) {
    /*
     _id                （更新时不变）
     inventar_num       资产编号
     name
     warehouse_id       （更新时不变）仓库
     merchant_id        （更新时不变）所属商户
     state
     district_code      国家-省-市-区编号
     address
     transit_info       公交说明
     map_info
     notice             门店公告
     create_time        （更新时不变）
     comment
     */
    var sql = " update ef_store set inventar_num='"+body.inventar_num+"'"
        +", name='"+body.name+"'"
        +", state='"+body.state+"'"
        +", district_code='"+body.district_code+"'"
        +" , address='"+body.address+"'"
        +", transit_info='"+body.transit_info+"'"
        +", map_info='"+body.map_info+"'"
        +", notice='"+body.notice+"'"
        +",  comment='"+body.comment+"'"
        +"  where _id="+body._id;
    mysql.query(sql,
                function(err, rs) {
            if(err) return cb(err);
            cb(err, rs);
    });
};

exports = module.exports = createStore;