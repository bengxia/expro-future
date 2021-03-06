/**
 * Created with JetBrains WebStorm.
 * User: 孟维
 * Date: 12-5-31
 * Time: 下午4:35
 * To change this template use File | Settings | File Templates.
 */
var models = require('../models'),
    Goods = models.Goods,
    GoodsType = models.GoodsType,
    Merchant_goods = models.Merchant_goods;

var check = require('validator').check;
var sanitize = require('validator').sanitize;

var config = require('../config').config;
var EventProxy = require('eventproxy').EventProxy;

var Log = require('../log.js');
var log = Log.create(Log.INFO, {'file':'public/node.debug'});
var MQClient = require('../libs/mq_client.js');

var getNow=function(){
    var now = new Date();
    var year = now.getFullYear();
    return (year+'-'+(now.getMonth()+1)+'-'+now.getDate()+' '+
        now.getHours()+':'+now.getMinutes()+':'+now.getSeconds());
};

/**
 * 开始设置前台表格控件说需要的相关对象及参数Start
 */
//设置查询区域的查询输入框，规则：{"查询字段名":"页面显示的label文字"}
var queryInput = {'_id':'编号','name':'名称','code':'资产编号', 'price':'售价', 'type_id':'商品类型'};
var showElement = ['_id', 'name', 'type_id', 'type_name', 'state', 'code', 'price', 'create_time', 'comment'];
////设置前台表格控件说需要的相关对象及参数End

/**
 * 显示商品列表
 * @param req
 * @param res
 * @param next
 */
exports.findAll = function(req,res,next){
    if(req.accepts('html')) {
        res.render('goods/index', {queryInput:queryInput});
    }else{
        console.log("获取所有商品信息。。。");
        //start=起始行数&limit=每页显示行数&bt=交易发生时间起点&et=交易发生时间的截至时间&sidx=排序字段名&sord=排序方式asc,desc
        var page = req.query.page;//起始行数 for jqgrid
        var start = req.query.start;//起始行数
        var limit = req.query.limit;//每页显示行数
        var bt = req.query.bt;//交易发生时间起点
        var et = req.query.et;//交易发生截至时间
        var sidx = req.query.sidx;//排序字段名
        var sord = req.query.sord;//排序方式
        var type_id = req.query.type_id;//商品类型ID
        var ep = EventProxy.create();

        //根据前台页面传入的查询条件，开始拼接where语句
        var where = ' ';
        for(key in queryInput){
            var value = req.query[key];
            if(value != undefined){
                where += ' and '+key+' like \'%'+value+'%\' ';
            }
        }

        //增加商品类型ID的查询条件
        if(type_id){
            where += ' and type_id='+type_id;
        }

        //回调函数
        function feedback(result) {
            if(200 == result.status) {
                if(result.jsonObj) {
                    //var jsonStr = JSON.stringify(result.jsonObj);
                    //console.log('jsonStr:'+jsonStr);
                    return res.json(result.jsonObj, result.status);
                }else{
                    ep.trigger('error', {status:400, error:'查询结果为空!'});
                }
            }
            else {
                return res.json(result, result.status);
            }
        };

        //当有异常发生时触发
        ep.once('error', function(result) {
            ep.unbind();//remove all event
            return feedback(result);
        });

        ep.on('findGoodsByOrgId', function(org_id) {
            findGoodsByOrgId(org_id);
        });

        ep.on('findCount', function(where) {
            findCount(where);
        });

        ep.on('findAllForWeb', function(where, count) {
            findAllForWeb(where, count);
        });

        //for client
        ep.on('findAll', function(where) {
            findAll(where);
        });

        //将传入的json对象发布到前台页面进行表格展示。
        ep.on('showList', function(jsonObj) {
            feedback({status:200, error:'获取数据成功', jsonObj:jsonObj});
        });

        //查询当前登陆用户所属商户
        //  首先获取当前登陆用户的org_id，查询当前用户的商户id
        if(req.session.user.member.org_id){
            ep.trigger('findGoodsByOrgId', req.session.user.member.org_id);
        }else{
            ep.trigger('error', {status:400, error:'获取当前用户所属商户失败。'});
        }

        //查询商户下所有的员工,并将查询到的member ids 拼接到已有where语句后，形成如下形式：
        //" and dealer_id in( 24, 23, 25, 26)";
        function findGoodsByOrgId(org_id){
            Merchant_goods.findAll({where:' and merchant_id='+org_id}, function(err, rs){
                if(err) { ep.unbind(); return next(err);}
                if (!rs || rs == undefined) return ep.trigger('error', {status:400, error:'当前商户下属的商品列表查询结果为空！'});
                //rs：获得当前登陆用户所属商户下的所有商品列表

                where += " and _id in(";
                for(var i=0; i<rs.length; i++){
                    where += " "+rs[i].goods_id;
                    if(i != rs.length-1){
                        where += ",";
                    }else{
                        where += ") ";
                    }
                }
                //判断当前请求的是客户端还是web端
                var isWeb = req.query.isWeb;
                //开始检查传入参数

                try{
                    check(isWeb).notNull().isInt();
                    if(1 == isWeb){
                        ep.trigger('findCount', where);
                    }else{
                        ep.trigger('findAll', where);
                    }
                }catch(e){
                    ep.trigger('findAll', where);
                }

            });
        };

        //查询count数
        function findCount(where){
            //获得数据行数，用于分页计算
            Goods.count({where:where, bt:bt, et:et}, function(err, count) {
                if(err) { ep.unbind(); return next(err);}
                if (!count || !count.count || 0 == count.count) return ep.trigger('error', {status:400, error:'查询结果为空!'});
                ep.trigger('findAllForWeb', where, count.count);
            });
        }

        //转为web服务
        function findAllForWeb(where, count) {

            if (!count && !count.count) return ep.trigger('error', {status:400, error:'查询结果为空!'});

            if(!sidx){
                sidx = 1;
            }

            // 查询结果总页数
            var total_pages = 0;

            // 计算查询结果页数
            if(count > 0 && limit > 0){
                total_pages = Math.ceil(count/limit);
            }

            // 若请求页大于总页数，设置请求页为最后一页
            if (page > total_pages) page = total_pages;

            // 计算起始行
            var start = limit * page - limit;
            // 若起始行为0
            if(start < 0) start = 0;

            Goods.findAll({where:where, start:start, limit:limit, sidx:sidx, sord:sord, bt:bt, et:et}, function(err, rs) {
                if(err) { ep.unbind(); return next(err);}
                if (!rs || rs == undefined || 0 == rs.length) return ep.trigger('error', {status:400, error:'查询结果为空！'});

                //开始汇总
                ep.after('goodsDone', rs.length, function() {
                    var jsonObj = new Object();

                    jsonObj.page = page;  // 当前页
                    jsonObj.total = total_pages;    // 总页数
                    jsonObj.records = count;  // 总记录数

                    //定义rows 数组，保存所有rows数据
                    var rowsArray = new Array();
                    for(var i=0; i<rs.length; i++){
                        // 定义rows
                        var rows = new Object();
                        rows.id = rs[i]._id;
                        //rows.cell = rs[i];
                        var ay = new Array();
                        for(key in rs[i]){
                            var index = showElement.indexOf(key);
                            if(index >= 0){
                                ay[index] = rs[i][key];
                            }
                        }
                        rows.cell = ay;
                        rowsArray[i] = rows;
                    }
                    //将rows数组赋予jsonObj.rows
                    jsonObj.rows = rowsArray;

                    //var jsonStr = JSON.stringify(jsonObj);
                    //console.log('jsonStr2:'+jsonStr);
                    return res.json(jsonObj, 200);
                });

                rs.forEach(function(goods) {
                    GoodsType.findOne({'_id':goods["type_id"]}, function(err, goodsType) {
                        if(err) { ep.unbind(); return next(err);}
                        if (!goodsType || goodsType == undefined) {//return ep.trigger('error', {status:400, error:'查询商品类型结果为空！'});
                            goods.type_name = "";
                        }else{
                            goods.type_name = goodsType.name;
                        }
                        ep.trigger('goodsDone', goods);
                    });
                });
            });
        };

        function findAll(where) {
            //start=起始行数&limit=每页显示行数&bt=交易发生时间起点&et=交易发生时间的截至时间&sidx=排序字段名&sord=排序方式asc,desc
            Goods.findAll({where:where, start:start, limit:limit, sidx:sidx, sord:sord, bt:bt, et:et}, function(err, rs) {
                if(err) { ep.unbind(); return next(err);}
                if (!rs || rs == undefined) return ep.trigger('error', {status:400, error:'查询结果为空！'});
                var jsonObj = {goods:rs};
                ep.trigger('showList', jsonObj);
            });
        };
    }
};


exports.pageNew = function(req, res, next) {
    console.log("新建弹出框。。。");
    // 3个状态： 新增， 查看， 编辑
    // - 新增(pageState=0)： _id 为空，isReadonly=false, 所有输入框为空，显示：保存按钮
    // - 查看(pageState=1)： _id不为空，isReadonly=true， 输入框有数据，显示：关闭按钮
    // - 编辑(pageState=2)： _id不为空，isReadonly=false， 输入框有数据，显示：保存按钮 + 关闭按钮
    var pageState = 0;
    res.render('goods/goods', { layout: false, pageState:pageState});
};

/**
 * 显示新增商品（无_id）,或已有商品（有_id）页面
 * @param req
 * @param res
 * @param next
 * @return {*}
 */
exports.pageView = function(req, res, next) {
    console.log("开始 pageView 。。。");
    var _id = req.params._id;
    // 本页面有3个状态： 新增， 查看， 编辑
    // - 新增(pageState=0)： 所有输入框为空，显示：保存按钮
    // - 查看(pageState=1)： 输入框有数据，显示：关闭按钮
    // - 编辑(pageState=2)： 输入框有数据，显示：保存按钮 + 关闭按钮
    var pageState = 1;
    try {
        check(_id, "流水号不能为空！").notNull();
        res.render('goods/goods', { layout: false, _id:_id, pageState:pageState});
    }catch(e){
        res.json({status:400, error:e.message}, 400);
    }
};

exports.pageEdit = function(req, res, next) {
    console.log("开始 pageEdit 。。。");
    var _id = req.params._id;
    // 本页面有3个状态： 新增， 查看， 编辑
    // - 新增(pageState=0)： 所有输入框为空，显示：保存按钮
    // - 查看(pageState=1)： 输入框有数据，显示：关闭按钮
    // - 编辑(pageState=2)： 输入框有数据，显示：保存按钮 + 关闭按钮
    var pageState = 2;
    try {
        check(_id, "流水号不能为空！").notNull();
        res.render('goods/goods', { layout: false, _id:_id, pageState:pageState});
    }catch(e){
        res.json({status:400, error:e.message}, 400);
    }
};

/**
 * 获取制定商品的数据
 * @param req
 * @param res
 * @param next
 */
exports.findOne = function(req, res, next) {
    console.log("开始 findOne 。。。");
    var _id = req.params._id;

    try {
        check(_id, "流水号不能为空！").notNull();
        Goods.findOneGoods({"_id":_id}, function(err,data){
            if(err) return next(err);
            if(!data) return res.json({status:404, error:"查询结果为空!"}, 404);

            var jsonObj = {goods:data};
            return res.json(jsonObj, 200);
         });
    }catch(e){
        return res.json({status:400, error:e.message}, 400);
    }
};

/**
 * 保存商品
 * @param req
 * @param res
 * @param next
 * @return {*}
 */
exports.saveGoods = function(req,res,next){
    console.log("saveGoods。。。");
    if(!req.session.user.member.org_id) return res.json({error:'未登录或当前用户不是商户员工!'}, 400);

    //开始校验输入数值的正确性
    var name = req.body.name;
    var type_id = req.body.type_id;
    var state = req.body.state;
    var code = sanitize(req.body.code).ifNull("");
    var price = req.body.price;
    var comment = sanitize(req.body.comment).ifNull("");

    try {
        check(name, "保存失败，名称不能为空！").notNull();
        check(type_id, "保存失败，请选择商品类型！").notNull();
        check(state, "保存失败，状态不能为空！").notNull();
        check(price, "保存失败，售价不能为空！").notNull();

        var goodsObj = {name:name, type_id:type_id, state:state, code:code, price:price, create_time:getNow(), comment:comment};
        Goods.create(goodsObj, function(err, info){
            if(err) return next(err);
            if(!info || !info.insertId) return res.json({error:'数据入库出错!'}, 500);
            var merchantGoodsObj = {merchant_id:req.session.user.member.org_id, goods_id:info.insertId};
            Merchant_goods.create(merchantGoodsObj, function(err2, info2){
                if(err2) return next(err2);
                //goodsObj._id = info.insertId;
                //goodsObj.merchant = {_id:req.session.user.member.org_id};
                var jsonObj = {goods:{_id:info.insertId}};
                return res.json(jsonObj, 201);
            });
        });
    }catch(e){
        res.json({status:400, error:e.message}, 400);
    }
};

/**
 * 更新商品
 * @param req
 * @param res
 * @param next
 * @return {*}
 */
exports.updateGoods = function(req,res,next){
    console.log(" ---------开始 updateGoods。。。");

    if(!req.session.user.member.org_id) return res.json({error:'未登录或当前用户不是商户员工!'}, 400);

    //开始校验输入数值的正确性
    var _id = req.body._id;
    var name = req.body.name;
    var type_id = req.body.type_id;
    var state = req.body.state;
    var code = sanitize(req.body.code).ifNull("");
    var price = req.body.price;
    var comment = sanitize(req.body.comment).ifNull("");
    try {
        check(_id, "更新失败，数据流水号不能为空！").notNull();
        check(name, "保存失败，名称不能为空！").notNull();
        check(type_id, "保存失败，请选择商品类型！").notNull();
        check(state, "保存失败，状态不能为空！").notNull();
        check(price, "保存失败，售价不能为空！").notNull();

        //说明是更新数据
        var goods = {_id:_id, name:name, type_id:type_id, state:state, code:code, price:price, comment:comment};
        Goods.update(goods, function(err,info){
            if(err) return next(err);

            //res.json({status:200, error:'更新商品信息成功!'}, 200);
            var jsonObj = {goods:goods};
            return res.json(jsonObj, 200);
        });
    }catch(e){
        res.json({status:400, error:e.message}, 400);
    }
};

/**
 * 批量删除商品
 * @param req
 * @param res
 * @param next
 */
exports.deleteGoods = function(req,res,next){
    //开始校验输入数值的正确性
    console.log("开始进行删除。。。。");
    if(!req.session.user.member.org_id) return res.json({error:'未登录或当前用户不是商户员工!'}, 400);

    var _ids = req.params._ids;

    try {
        check(_ids, "删除失败，删除数据的流水号不能为空！").notNull();

        Goods.delete(_ids, function(err,ds){
            if(err) return next(err);
            Merchant_goods.delete({merchant_id:req.session.user.member.org_id, ids:_ids}, function(err2, ds2){
                if(err2) return next(err2);
                return res.json({goods:{_ids:_ids}}, 202);
            });
        });
    }catch(e){
        res.json({status:400, error:e.message}, 400);
    }
};

/**
 * 显示商品类型页面
 * @param req
 * @param res
 * @param next
 */
exports.showTypes = function(req,res,next){
    console.log("开始显示类型。。。。");
    if(req.accepts('html')) {
        res.render('goodstype/index', {});
    }else{
        GoodsType.findAll({where:""}, function(err, rs){
            if(err) return next(err);
            //var jsonStr = JSON.stringify(rs);
            //console.log('jsonStr:'+jsonStr);
            return res.json(rs, 200);
            /*
             if(rs && rs.length>0){
             //如果有数据，则准备展示
             //var jsonStr = JSON.stringify(rs);
             //console.log('jsonStr:'+jsonStr);
             //return res.json({"status":"200", "error":'获取数据成功', "goodsTypes":rs});
             return res.json(rs, 200);
             }else{
             return res.json({"status":"204", "error":'获取数据失败'});
             }*/
        });
//        try {
            //check(_ids, "删除失败，删除数据的流水号不能为空！").notNull();

//            var pId = req.query.id?req.query.id:"0";
//            var pName = req.query.n?(req.query.n+"."):"";
//            var pLevel = req.query.lv?req.query.lv:"0";
//            var pCheck = req.query.chk?req.query.chk:"";
//
//            var privacy = sanitize(req.query.id).ifNull(0);
//        }catch(e){
//            res.json({status:400, error:e.message}, 400);
//        }
    }
};

/**
 *
 * @param req
 * @param res
 * @param next
 */
exports.showTypeDetail = function(req,res,next){
    console.log("开始显示类型详情。。。。");
    if(req.accepts('html')) {
        res.render('goodstype/index');
    }else{
        var _id = req.params._id;
        try {
            check(_id, "数据的流水号不能为空！").notNull();
            GoodsType.findOne({_id:_id}, function(err, rs){
                if(err) return next(err);
                //var jsonStr = JSON.stringify(rs);
                //console.log('jsonStr:'+jsonStr);
                return res.json(rs, 200);
            });
        }catch(e){
            res.json({status:400, error:e.message}, 400);
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
    var comment = sanitize(req.body.comment).ifNull("");

    try {
        check(name, "名称不能为空!").notNull();
        check(level, "节点等级不能为空!").notNull();
        check(isleaf, "是否叶子节点标记不能为空!").notNull();

        GoodsType.create({parent_id:parent_id, isleaf:isleaf, level:level, name:name, comment:comment, create_time:getNow()}, function(err, info){
            if(err) return next(err);
            if(!info || !info.insertId) return res.json({error:'数据入库出错!'}, 500);
            if(parent_id && parent_id != ""){
                //新类型为叶子节点，如果有父（非root），并且父为叶子，则设置父类型为枝节点。
                GoodsType.findOne({_id:parent_id}, function(err, parent){
                    if(err) return next(err);
                    if(parent){
                        parent.isleaf = 0;
                        GoodsType.update(parent, function(err, rs){
                            if(err) return next(err);
                            res.json({goodstype:{_id:info.insertId}}, 201);
                        });
                    }else{
                        return res.json({error:'未找到对应父节点！'}, 500);
                    }
                });
            }
        });
    }catch(e){
        res.json({status:400, error:e.message}, 400);
    }


};

exports.updateType = function(req,res,next){
    //开始校验输入数值的正确性
    //开始校验输入数值的正确性
    var _id = req.body._id;
    var parent_id = req.body.parent_id;
    var isleaf = req.body.isleaf;
    var level = req.body.level;
    var name = req.body.name;
    var comment = sanitize(req.body.comment).ifNull("");

//    if(!name) return res.json({status:400, error:'名字不能为空!'}, 400);

    try {
        check(_id, "流水号为空，更新失败!").notNull();
        check(name, "名称不能为空!").notNull();
        check(level, "节点等级不能为空!").notNull();
        check(isleaf, "是否叶子节点标记不能为空!").notNull();

        //流水号不为空，说明是更新
        GoodsType.update({_id:_id, parent_id:parent_id, isleaf:isleaf, level:level, name:name, comment:comment}, function(err, rs){
            if(err) return next(err);
            res.json({goodstype:{_id:_id}}, 200);
        });
    }catch(e){
        res.json({status:400, error:e.message}, 400);
    }
};

exports.deleteType = function(req,res,next){
    //开始校验输入数值的正确性
    console.log("开始进行删除。。。。");
    var _id = req.params._id;
    try {
        check(_id, "流水号为空，删除失败!").notNull();
        delChildren(_id);
        GoodsType.delete({_ids:_id}, function(err,ds){
            if(err) return next(err);
            return res.json({goodstype:{_ids:_id}}, 202);
        });
    }catch(e){
        res.json({status:400, error:e.message}, 400);
    }
};

/**
 * 递归循环删除 以_id 为父节点的所有子节点
 * @param _id
 */
function delChildren(_id){
    //todo 本方法逻辑有问题，需后期修正
    try {
        check(_id, "流水号为空，删除失败!").notNull();

        var where = " and parent_id="+_id;
        GoodsType.findAll({where:where}, function(err, rs){
            if(err) return next(err);
            if(rs && rs.length > 0){
                //如果有数据
                var _ids = "";
                for(var i = 0; i < rs.length; i++)
                {
                    _ids += (_ids.length > 0 ? ",":"")+rs[i]._id;
                    delChildren(rs[i]._id);
                }
                GoodsType.delete({_ids:_ids}, function(err,ds){
                    if(err) return next(err);
                });
            }
        });
    }catch(e){
        return res.json({status:400, error:e.message}, 400);
    }
};
//function delChildren(_id){
//    //todo 本方法逻辑有问题，需后期修正
//    try {
//        check(_id, "流水号为空，删除失败!").notNull();
//
//        var where = " and goods_type.parent_id="+_id;
//        GoodsType.findAll({where:where}, function(err, rs){
//            if(err) return next(err);
//            if(rs && rs.length){
//                //如果有数据
//                var _ids = "";
//                for(var i = 0; i < rs.length; i++)
//                {
//                    _ids += (_ids.length > 0 ? ",":"")+rs[i]._id;
//                    delChildren(rs[i]._id);
//                }
//                GoodsType.delete({_ids:_ids}, function(err,ds){
//                    if(err) return next(err);
//                });
//            }
//        });
//    }catch(e){
//        return res.json({status:400, error:e.message}, 400);
//    }
//};