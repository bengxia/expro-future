/**
 * Created with JetBrains WebStorm.
 * User: Administrator
 * Date: 12-5-31
 * Time: 下午4:35
 * To change this template use File | Settings | File Templates.
 */
var models = require('../models'),
    Goods = models.goods,
    GoodsType = models.goodstype;

var check = require('validator').check,
    sanitize = require('validator').sanitize;

var getNow=function(){
    var now = new Date();
    var year = now.getFullYear();
    return (year+'-'+(now.getMonth()+1)+'-'+now.getDate()+' '+
        now.getHours()+':'+now.getMinutes()+':'+now.getSeconds());
};

exports.showTypes = function(req,res,next){
    res.render('goods/type', {});
};
