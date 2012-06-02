/**
 * Created with JetBrains WebStorm.
 * User: Administrator
 * Date: 12-5-31
 * Time: 下午4:35
 * To change this template use File | Settings | File Templates.
 */
var models = require('../models'),
    Goods = models.Goods,
    GoodsType = models.GoodsType;

var check = require('validator').check,
    sanitize = require('validator').sanitize;

var getNow=function(){
    var now = new Date();
    var year = now.getFullYear();
    return (year+'-'+(now.getMonth()+1)+'-'+now.getDate()+' '+
        now.getHours()+':'+now.getMinutes()+':'+now.getSeconds());
};

/**
 * 显示商品列表
 * @param req
 * @param res
 * @param next
 */
exports.index = function(req,res,next){
    if(req.accepts('html')) {
        res.render('goods/goods', {});
    }
};
/**
 * 显示商品类型页面
 * @param req
 * @param res
 * @param next
 */
exports.showTypes = function(req,res,next){
    if(req.accepts('html')) {
        res.render('goods/type', { layout: false});
    }else{
        var pId = req.query.id?req.query.id:"0";
        var pName = req.query.n?(req.query.n+"."):"";
        var pLevel = req.query.lv?req.query.lv:"0";
        var pCheck = req.query.chk?req.query.chk:"";

        GoodsType.findAll("", function(err, rs){
            if(err) return next(err);
            if(rs&&rs.length>0){
                //如果有数据，则准备展示
                var jsonStr = JSON.stringify(rs);
                console.log('jsonStr:'+jsonStr);
                return res.json(rs);
            }
        });
    }
};

/**
 *
 * @param req
 * @param res
 * @param next
 */
exports.showTypeDetail = function(req,res,next){
    if(req.accepts('html')) {
        res.render('goods/type', { layout: false});
    }else{
        var _id = req.query._id;
        if(_id){
            GoodsType.findOne(_id, function(err, rs){
                if(err) return next(err);
                if(rs&&rs.length>0){
                    //如果有数据，则准备展示
                    //var jsonStr = JSON.stringify(rs);
                    //console.log('jsonStr:'+jsonStr);
                    return res.json(rs);
                }
            });
        }
    }
};

/**
 * 创建新商品类型
 *   新类型为叶子节点，如果有父（非root），并且父为叶子，则设置父类型为枝节点。
 * @param req
 * @param res
 * @param next
 * @return {*}
 */
exports.creatType = function(req,res,next){
    //开始校验输入数值的正确性
    var _id = req.body._id;
    var parent_id = req.body.parent_id;
    var isleaf = req.body.isleaf;
    var level = req.body.level;
    var name = req.body.name;
    var comment = req.body.comment;

    if(!name) return res.json({status:'名字不能为空！'});

    if(_id && _id != ""){
        //流水号不为空，说明是更新
        GoodsType.update(req.body, function(err, rs){
            if(err) return next(err);
            res.json({status:'success'});
        });
    }else{
        //创建
        req.body.create_time = getNow();

        GoodsType.create(req.body, function(err, info){
            if(err) return next(err);
            if(parent_id && parent_id != ""){
                //新类型为叶子节点，如果有父（非root），并且父为叶子，则设置父类型为枝节点。
                GoodsType.findOne(parent_id, function(err, parent){
                    if(err) return next(err);
                    if(parent){
                        parent.isleaf = 0;
                        GoodsType.update(parent, function(err, rs){
                            if(err) return next(err);
                            res.json({status:'success'});
                        });
                    }
                });
            }
        });
    }
};

exports.deleteType = function(req,res,next){
    //开始校验输入数值的正确性
    var _id = req.query._id;
    console.log('_id:'+_id);
    GoodsType.delete(_id, function(err,ds){
        if(err) return next(err);
        //return res.write(_ids);
        return res.json({'_ids':_ids, status:'success'});
    });
};