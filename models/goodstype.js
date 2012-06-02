/**
 * Created with JetBrains WebStorm.
 * User: Mengwei
 * Date: 12-5-31
 * Time: 下午4:38
 * To change this template use File | Settings | File Templates.
 */
var mysql = require('../libs/mysql.js');

function createGoodsType() {
    return new GoodsType();
};

function GoodsType() {
    this.table = '`ef_goods_type`';
};

GoodsType.prototype.findAll = function(where, cb) {
    var sql = " SELECT goods_type._id _id, goods_type.parent_id parent_id, goods_type.name name, "
        +" goods_type.create_time create_time, goods_type.isleaf isleaf, goods_type.level level, goods_type.comment comment "
        +" FROM ef_goods_type goods_type "
        +" where 1=1 "+ where;
    mysql.query(sql, function(err, rs) {
        if(err) return cb(err);
        if(!rs.length) return cb(err);
        cb(err, rs);
    });
};

GoodsType.prototype.findOne = function(id, cb) {
    var sql = " SELECT goods_type._id _id, goods_type.parent_id parent_id, goods_type.name name, "
        +" goods_type.create_time create_time, goods_type.isleaf isleaf, goods_type.level level, goods_type.comment comment "
        +" FROM ef_goods_type goods_type "
        +" where _id="+ id;
    mysql.query(sql, function(err, rs) {
        if(err) return cb(err);
        if(!rs.length) return cb(err);
            cb(err, rs[0]);
    });
};

GoodsType.prototype.create = function(body, cb) {
    var opt = {
        table: 'ef_goods_type',
        fields: body
    };
    mysql.insert(opt, function(err, info) {
        if(err) return next(err);
        return cb(err, info);
    });
};

/**
 * 删除指定的一个或多个类型
 * @param ids
 * @param cb
 */
GoodsType.prototype.delete = function(ids, cb) {
    var sql = " delete from ef_goods_type where _id in(" + ids + ") ";
    mysql.query(sql, function(err, rs) {
        if(err) return cb(err);
        cb(err, rs);
    });
};

/**
 * 更新商品类型信息
 * @param body
 * @param cb
 */
GoodsType.prototype.update = function(body, cb) {
    var sql = " update ef_goods_type set "
        +"  parent_id='"+body.parent_id+"' "
        +", level='"+body.level+"' "
        +", isleaf='"+body.isleaf+"' "
        +", name='"+body.name+"' "
        +", comment='"+body.comment+"' "
        +"  where _id="+body._id;
    mysql.query(sql,
        function(err, rs) {
            if(err) return cb(err);
            cb(err, rs);
        });
};

exports = module.exports = createGoodsType;