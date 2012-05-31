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


exports = module.exports = createGoods;