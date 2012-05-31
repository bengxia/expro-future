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


exports = module.exports = createGoodsType;