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
        res.render('goods/index', {});
    }else{
        var where = ' ';
        var _id = req.query._id;
        var name = req.query.name;

        if(_id != undefined){
            where += ' and goods._id like \'%'+_id+'%\' ';
        }
        if(name != undefined){
            where += ' and goods.name like \'%'+name+'%\' ';
        }

        Goods.count(where, function(err,ds){
            if(err) return next(err);

            var page = req.query.page; // 取得当前页数,注意这是jqgrid自身的参数
            var limit = req.query.rows; // 取得每页显示行数，,注意这是jqgrid自身的参数
            var sidx = req.query.sidx; //取得排序字段
            var sord  = req.query.sord;//排序方式asc、desc

            if(!sidx){
                sidx = 1;
            }
            // 计算查询结果总行数
            var count = ds[0].count;
            // 查询结果总页数
            var total_pages = 0;

            // 计算查询结果页数
            if(count > 0 && limit > 0){
                total_pages = Math.ceil(count/limit);
            }
            // 若请求页大于总页数，设置请求页为最后一页
            if (page > total_pages) page=total_pages;

            // 计算起始行
            var start = limit * page - limit;
            // 若起始行为0
            if(start < 0) start = 0;

            Goods.findAll(where, start, limit, sidx, sord, function(err,ds){
                if(err) return next(err);

                if (ds == undefined){
                    return res.json({status:'查询结果为空！'});
                }
                var jsonObj = new Object();
                jsonObj.page = page;  // 当前页
                jsonObj.total = total_pages;    // 总页数
                jsonObj.records = count;  // 总记录数

                //定义rows 数组，保存所有rows数据
                var rowsArray = new Array();
                for(var i=0; i<ds.length; i++){
                    // 定义rows
                    var rows = new Object();
                    rows.id = ds[i]._id;
                    rows.cell = [ds[i]._id, ds[i].name, ds[i].inventar_num, ds[i].goods_type_name, ds[i].state, ds[i].price, ds[i].create_time];
                    rowsArray[i] = rows;
                }
                //将rows数组赋予jsonObj.rows
                jsonObj.rows = rowsArray;

                //var jsonStr = JSON.stringify(jsonObj);
                //console.log('jsonStr:'+jsonStr);
                return res.json(jsonObj);
            });
        });
    }
};

/**
 * 显示新增商品（无_id）,或已有商品（有_id）页面
 * @param req
 * @param res
 * @param next
 * @return {*}
 */
exports.showGoods = function(req, res, next) {
    console.log("开始显示 新建||编辑||查看 弹出框。。。"+req.query._id);
    var _id = req.params._id;
    var isEdit = req.query.isEdit?req.query.isEdit:"false";

    // 本页面有3个状态： 新增， 查看， 编辑
    // - 新增： _id 为空，isReadonly=false, 所有输入框为空，显示：保存按钮
    // - 编辑： _id不为空，isReadonly=false， 输入框有数据，显示：保存按钮 + 关闭按钮
    // - 查看： _id不为空，isReadonly=true， 输入框有数据，显示：关闭按钮
    var isReadonly = false;
    var isShowSaveBt = true;
    //如果_id不为空，则弹出编辑页面
    if(_id){
        //编辑 和 查看
        if(!isEdit || isEdit != "true"){
            //查看状态
            isReadonly = true;
            isShowSaveBt = false;
        }

        var opt = new Object();
        opt._id = _id;
        Goods.findOne(opt, function(err,ds){
            if(err) return next(err);
            res.render('goods/goods', { layout: false, goods:ds, isReadonly:isReadonly, isShowSaveBt:isShowSaveBt});
        });
    }else{
        //新增
        res.render('goods/goods', { layout: false, isReadonly:isReadonly, isShowSaveBt:isShowSaveBt});
    }
};

exports.saveOrUpdateGoods = function(req,res,next){
    //开始校验输入数值的正确性
    var _id = req.body._id;
    var name = req.body.name;

    if(!name) return res.json({status:'名字不能为空！'});

    if(_id){
        //说明是更新数据
        Goods.update(req.body, function(err,info){
            if(err) return next(err);
            res.json({status:'success'});
        });
    }else{
        //说明是新增
        //创建时间
        req.body.create_time = getNow();
        Goods.create(req.body, function(err, info){
            if(err) return next(err);
            res.json({status:'success'});
        });
    }
};

exports.deleteGoods = function(req,res,next){
    //开始校验输入数值的正确性
    console.log("开始进行删除。。。。");
    var _ids = req.params._ids;
    console.log('_ids:'+_ids);
    //console.log('parent._ids:'+parent._ids);
    Goods.delete(_ids, function(err,ds){
        if(err) return next(err);
        return res.json({'_ids':_ids});
    });
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
                if(rs){
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
};

exports.updateType = function(req,res,next){
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
        res.json({status:'流水号为空，更新失败！'});
    }
};
exports.deleteType = function(req,res,next){
    //开始校验输入数值的正确性
    console.log("开始进行删除。。。。");
    var _id = req.params._id;
    console.log('_id:'+_id);
    var parent = new Object();
    //parent._id = _id;
    //parent._ids = _id;
    delChildren(_id);
    //console.log('parent._ids:'+parent._ids);
    GoodsType.delete(_id, function(err,ds){
        if(err) return next(err);
        return res.json({status:'success'});
    });
};

/**
 * 递归循环删除 以_id 为父节点的所有子节点
 * @param _id
 */
function delChildren(_id){
    if(_id)
    {
        var where = " and goods_type.parent_id="+_id;
        GoodsType.findAll(where, function(err, rs){
            if(err) return next(err);
            if(rs && rs.length){
                //如果有数据
                var _ids = "";
                for(var i = 0; i < rs.length; i++)
                {
                    _ids += (_ids.length > 0 ? ",":"")+rs[i]._id;
                    delChildren(rs[i]._id);
                }
                GoodsType.delete(_ids, function(err,ds){
                    if(err) return next(err);
                });
            }
        });
    }
};