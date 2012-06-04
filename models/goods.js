/**
 * Created with JetBrains WebStorm.
 * User: Mengwei
 * Date: 12-5-31
 * Time: 下午4:35
 * To change this template use File | Settings | File Templates.
 */
var mysql = require('../libs/mysql.js');

function createGoods() {
    return new Goods();
};

function Goods() {
    this.table = '`ef_goods`';
};

/**
 * 根据条件查询相关的商品列表
 * @param where
 * @param cb
 */
Goods.prototype.findAll = function(where, start, limit, sidx, sord, cb) {
    var sql = " SELECT goods._id _id, goods.name name, goods_type.name goods_type_name, "
        +" goods.type_id type_id, goods.state state, goods.inventar_num inventar_num, goods.price price, "
        +" goods.create_time create_time, goods.comment comment "
        +" FROM ef_goods goods , ef_goods_type goods_type "
        +" where goods.type_id = goods_type._id "+ where
        +" ORDER BY "+sidx+" "+sord
        +" LIMIT "+ start + " , "+limit;
    mysql.query(sql, function(err, rs) {
        if(err) return cb(err);
        if(!rs.length) return cb(err);
        cb(err, rs);
    });
};

/**
 * 根据条件获得数据的行数
 * @param where 页面传入的查询条件
 * @param cb 回调
 */
Goods.prototype.count = function(where, cb) {
    var sql = "SELECT COUNT(*) AS count FROM ef_goods goods where 1=1 "+where;
    mysql.query(sql, function(err, rs) {
        if(err) return cb(err);
        if(!rs.length) return cb(err);
        cb(err, rs);
    });
};

/**
 * 查询指定商品。
 * @param opt 包含_id属性
 * @param cb
 */
Goods.prototype.findOne = function(opt, cb) {

    var sql = " SELECT goods._id _id, goods.name name, goods_type.name goods_type_name, "
        +" goods.type_id type_id, goods.state state, goods.inventar_num inventar_num, goods.price price, "
        +" goods.create_time create_time, goods.comment comment "
        +" FROM ef_goods goods , ef_goods_type goods_type "
        +" where goods.type_id = goods_type._id and goods._id="+ opt._id;

    mysql.query(sql, function(err, rs) {
        if(err) return cb(err);
        if(!rs.length) return cb(err);
        cb(err, rs[0]);
    });
};

/**
 * 创建商品
 * @param body 前台传入的页面提交数据对象
 * @param cb 回调
 */
Goods.prototype.create = function(body, cb) {
    var opt = {
        table: 'ef_goods',
        fields: body
    };
    mysql.insert(opt, function(err, info) {
        if(err) return next(err);
        return cb(err, info);
    });
};

/**
 * 删除一批商品
 * @param ids 商品的序号，可以为多个以','号分隔，例如：01,02,03
 * @param cb 回调
 */
Goods.prototype.delete = function(ids, cb) {
    var sql = " delete from ef_goods where _id in(" + ids + ") ";
    mysql.query(sql, function(err, rs) {
        if(err) return cb(err);
        cb(err, rs);
    });
};

/**
 * 更新商品
 * @param body 前台传入的页面提交数据对象
 * @param cb 回调
 */
Goods.prototype.update = function(body, cb) {
    var opt = {
        table: 'ef_goods',
        fields: body
    };
    mysql.update(opt, function(err, info) {
        if(err) return next(err);
        return cb(err, info);
    });
};


exports = module.exports = createGoods;