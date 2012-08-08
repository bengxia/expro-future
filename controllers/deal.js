var models = require('../models');
var Deal = models.Deal;
var Deal_item = models.Deal_item;
var Member = models.Member;

var check = require('validator').check,
    sanitize = require('validator').sanitize;

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
var queryInput = {'_id_01':'编号','payment_01':'应付账款','cash_01':'现金支付','point_01':'积分支付'};

////设置前台表格控件说需要的相关对象及参数End


/**
 * 查询总数
 * 查询条件：bt=交易发生时间起点&et=交易发生时间的截至时间
 * @param req
 * @param res
 * @param next
 */
exports.count = function(req,res,next){
    var bt = req.query.bt;//交易发生时间起点
    var et = req.query.et;//交易发生截至时间

    var ep = EventProxy.create();

    var where = ' ';

    //查询
    var customer_id = req.query.customer_id;//会员ID
    var type = req.query.type;//交易类型

    if(customer_id) where += " and customer_id="+customer_id;
    if(type) where += " and type="+type;

    //当有异常发生时触发
    ep.once('error', function(result) {
        ep.unbind();//remove all event
        return feedback(result);
    });

    //查询商户下所有的员工
    ep.on('findMembersByOrgId', function(org_id) {
        findMembersByOrgId(org_id);
    });
    //查询当前所有交易的信息，在此方法内部会关联user，role，merchant表，并进行分页处理
    ep.on('findDealCount', function(where) {
        findDealCount(where);
    });

    //将传入的json对象发布到前台页面进行表格展示。
    ep.on('showList', function(count) {
        feedback({status:200, error:'获取数据成功', jsonObj:count});
    });

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

    //查询当前登陆用户所属商户
    //  首先获取当前登陆用户的org_id，查询当前用户的商户id
    if(req.session.user.member.org_id){
        ep.trigger('findMembersByOrgId', req.session.user.member.org_id);
    }else{
        ep.trigger('error', {status:400, error:'获取当前用户所属商户失败。'});
    }

    //查询商户下所有的员工,并将查询到的member ids 拼接到已有where语句后，形成如下形式：
    //" and dealer_id in( 24, 23, 25, 26)";
    function findMembersByOrgId(org_id){
        Member.findAll({where:' and org_id='+org_id}, function(err, rs){
            if(err) { ep.unbind(); return next(err);}
            if (!rs || rs == undefined) return ep.trigger('error', {status:400, error:'商户查询结果为空！'});
            where += " and dealer_id in(";
            for(var i=0; i<rs.length; i++){
                where += " "+rs[i]._id;
                if(i != rs.length-1){
                    where += ",";
                }else{
                    where += ") ";
                }
            }
            ep.trigger('findDealCount', where);
        });
    }

    //查询count数
    function findDealCount(where){
        //获得数据行数，用于分页计算
        Deal.count({where:where, bt:bt, et:et}, function(err, count) {
            if(err) { ep.unbind(); return next(err);}
            if (!count && !count.count) return ep.trigger('error', {status:400, error:'查询结果为空!'});
            ep.trigger('showList', {count:count.count});
        });
    }
};

/**
 * 显示交易列表
 * @param req
 * @param res
 * @param next
 */
exports.index = function(req,res,next){
    if(req.accepts('html')) {
        res.render('deal/index', {queryInput:queryInput});
    }else{
        //start=起始行数&limit=每页显示行数&bt=交易发生时间起点&et=交易发生时间的截至时间&sidx=排序字段名&sord=排序方式asc,desc
        var page = req.query.page;//起始行数 for jqgrid
        var start = req.query.start;//起始行数
        var limit = req.query.limit;//每页显示行数
        var bt = req.query.bt;//交易发生时间起点
        var et = req.query.et;//交易发生截至时间
        var sidx = req.query.sidx;//排序字段名
        var sord = req.query.sord;//排序方式

        var ep = EventProxy.create();

        //根据前台页面传入的查询条件，开始拼接where语句
        var where = ' ';
//        for(key in queryInput){
//            var value = req.query[key];
//            if(value != undefined){
//                where += ' and '+key+' like \'%'+value+'%\' ';
//            }
//        }

        //查询
        var customer_id = req.query.customer_id;//会员ID
        var type = req.query.type;//交易类型

        if(customer_id) where += " and customer_id="+customer_id;
        if(type) where += " and type="+type;

        //回调函数
        function feedback(result) {
            if(200 == result.status) {
                if(result.jsonObj) {
//                    var jsonStr = JSON.stringify(result.jsonObj);
//                    console.log('jsonStr:'+jsonStr);
                    return res.json(result.jsonObj, result.status);
                }else{
                    ep.trigger('error', {status:400, error:'未获得数据!'});
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

        //查询商户下所有的员工
        ep.on('findMembersByOrgId', function(org_id) {
            findMembersByOrgId(org_id);
        });

        //查询当前所有交易的信息，在此方法内部会关联user，role，merchant表，并进行分页处理
        ep.on('findDealCount', function(where) {
            findDealCount(where);
        });

        ep.on('findAllDeal', function(where) {
            findAllDeal(where);
        });


        ep.on('findAllDealForWeb', function(where, count) {
            findAllDealForWeb(where, count);
        });

        //将传入的json对象发布到前台页面进行表格展示。
//        ep.on('showList', function(jsonObj) {
//            feedback({status:200, error:'获取数据成功', jsonObj:jsonObj});
//        });

        //查询当前登陆用户所属商户
        //  首先获取当前登陆用户的org_id，查询当前用户的商户id
        if(req.session.user.member.org_id){
            ep.trigger('findMembersByOrgId', req.session.user.member.org_id);
        }else{
            ep.trigger('error', {status:400, error:'获取当前用户所属商户失败。'});
        }

        //查询商户下所有的员工,并将查询到的member ids 拼接到已有where语句后，形成如下形式：
        //" and dealer_id in( 24, 23, 25, 26)";
        function findMembersByOrgId(org_id){
            Member.findAll({where:' and org_id='+org_id}, function(err, rs){
                if(err) { ep.unbind(); return next(err);}
                if (!rs || rs == undefined) return ep.trigger('error', {status:400, error:'商户查询结果为空！'});
                where += " and dealer_id in(";
                for(var i=0; i<rs.length; i++){
                    where += " "+rs[i]._id;
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
                    if(isWeb == 1){
                        ep.trigger('findDealCount', where);
                    }else{
                        ep.trigger('findAllDeal', where);
                    }
                }catch(e){
                    ep.trigger('findAllDeal', where);
                }

            });
        };

        //查询count数
        function findDealCount(where){
            //获得数据行数，用于分页计算
            Deal.count({where:where, bt:bt, et:et}, function(err, count) {
                if(err) { ep.unbind(); return next(err);}
                if (!count && !count.count) return ep.trigger('error', {status:400, error:'交易数量查询结果为空!'});
                ep.trigger('findAllDealForWeb', where, count.count);
            });
        }

        //转为web服务
        function findAllDealForWeb(where, count) {
            var showElement = ['_id', 'type', 'state', 'store_id', 'dealer_id', 'payment', 'cash', 'point', 'pay_type', 'create_time', 'customer_id'];

            if (!count && !count.count) return ep.trigger('error', {status:400, error:'交易数量查询结果为空!'});

//            var page = req.query.page;//起始行数 for jqgrid
//            console.log("page："+page);
//            console.log("limit："+limit);
            //console.log("page："+page);

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

            Deal.findAll({where:where, start:start, limit:limit, sidx:sidx, sord:sord, bt:bt, et:et}, function(err, rs) {
                if(err) { ep.unbind(); return next(err);}
                if (!rs || rs == undefined) return ep.trigger('error', {status:400, error:'交易查询结果为空！'});

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

                var jsonStr = JSON.stringify(jsonObj);
                console.log('jsonStr2:'+jsonStr);
                return res.json(jsonObj, 200);
            });
        };

        function findAllDeal(where) {
            //start=起始行数&limit=每页显示行数&bt=交易发生时间起点&et=交易发生时间的截至时间&sidx=排序字段名&sord=排序方式asc,desc
            Deal.findAll({where:where, start:start, limit:limit, sidx:sidx, sord:sord, bt:bt, et:et}, function(err, rs) {
                if(err) { ep.unbind(); return next(err);}
//                var jsonStr111 = JSON.stringify(rs);
//                console.log('jsonStr44444:'+jsonStr111);
                if (!rs || rs == undefined) return ep.trigger('error', {status:400, where:where, error:'查询结果为空！'});
                var jsonObj = {deals:rs};
                //ep.trigger('showList', jsonObj);
                feedback({status:200, error:'获取数据成功', jsonObj:jsonObj});
            });
        };
    }
};

/**
 * 实现保存交易
 * @param postObj
 * @param res
 * @param next
 */
function saveDealAndDealItems(postObj,res,next){
    var ep = EventProxy.create();
    var deal_items = postObj.deal_items;
    delete postObj.deal_items;
    Deal.create(postObj, function(err, info){
        var returnObj = {_id:info.insertId};
        if(err) return next(err);
        if(!info || !info.insertId) return res.json({error:'数据入库出错!'}, 500);
        if(postObj.type == 2 || postObj.type == 3 || postObj.type == 4 || postObj.type == 8){
            return res.json(returnObj, 201);
        }else{
            if(!deal_items || !deal_items.length || deal_items.length <= 0) return res.json({status:400, error:"保存失败，交易明细不能为空！"}, 400);
            var i = 0;
            deal_items.forEach(function(item) {
                item.deal_id = info.insertId;
                Deal_item.create(item, function(err2, info2) {
                    if(err2) return next(err2);
                    if(!info2 || !info2.insertId) return res.json({error:'数据入库出错!'}, 500);
                    //returnObj.deal.deal_items[i]={_id:info2.insertId};
                    i++;
                    ep.trigger('done', returnObj);
                });
            });
            ep.after('done', deal_items.length, function(obj) {
                return res.json(returnObj, 201);
            });
        }
    });
};
exports.saveDeal = function(req,res,next){
    console.log("saveDeal。。。");
    //开始校验输入数值的正确性
    var type = req.body.type;
    var state = req.body.state;
    var store_id = req.body.store_id;
    var payment = sanitize(req.body.payment).ifNull(0.00);
    var cash = sanitize(req.body.cash).ifNull(0.00);
    var point = sanitize(req.body.point).ifNull(0.00);
    var pay_type = req.body.pay_type;
    var deal_items = req.body.deal_items;
    var repeal_id = req.body.repeal_id;
    var customer_id = req.body.customer_id;
    var saving_due_time = req.body.saving_due_time;
    var org_id = req.session.user.member.org_id;

    if(!org_id) return res.json({error:'未登录或当前用户不是商户员工!'}, 400);

    try {

        check(type, "保存失败，交易类型不能为空！").notNull();
        check(state, "保存失败，交易状态不能为空！").notNull();
        check(store_id, "保存失败，门店不能为空！").notNull();
        var postObj = {type:type, state:state, store_id:store_id, payment:payment, cash:cash, point:point,
            pay_type:pay_type, deal_items:deal_items, repeal_id:repeal_id, customer_id:customer_id, create_time:getNow()};
        if(type == 2 || type == 3){
            check(customer_id, "会员ID不能为空！").notNull();
            check(cash, "储值金额不能为空！").notNull();
            check(saving_due_time, "储值有效期不能为空！").notNull();
            check(org_id, "获取当前用户所属商户失败！").notNull();
            Member.findOne({_id:customer_id, org_id:org_id}, function(err, member){
                if(err) return next(err);
                var savings = parseFloat(sanitize(member.savings).ifNull(0.00));
                if(type == 2){
                    savings += parseFloat(cash);
                }else if(type == 3){
                    savings -= parseFloat(cash);
                }
                var memberObj = {_id:customer_id, savings:savings, saving_due_time:saving_due_time};
                console.log("111111111111111111111111");
                //充值
                MQClient.pub('doSaving', memberObj);
            });
        }
        saveDealAndDealItems(postObj,res,next);
    }catch(e){
        return res.json({status:400, error:e.message}, 400);
    }
};

/**
 * 保存一次退货交易
 * @param req
 * @param res
 * @param next
 * @return {*}
 */
exports.saverRepealDeal = function(req,res,next){
    console.log("saverRepealDeal。。。");
    if(!req.session.user.member.org_id) return res.json({error:'未登录或当前用户不是商户员工!'}, 400);
    //开始校验输入数值的正确性
    var type = req.body.type;
    var state = req.body.state;
    var store_id = req.body.store_id;
    var payment = sanitize(req.body.payment).ifNull(0.00);
    var cash = sanitize(req.body.cash).ifNull(0.00);
    var point = sanitize(req.body.point).ifNull(0.00);
    var pay_type = req.body.pay_type;
    var deal_items = req.body.deal_items;
    var repeal_id = req.body.repeal_id;
    var customer_id = req.body.customer_id;
    if(!deal_items || !deal_items.length || deal_items.length <= 0) return res.json({status:400, error:"保存失败，交易明细不能为空！"}, 400);
    try {
        check(type, "保存失败，交易类型不能为空！").notNull();
        check(state, "保存失败，交易状态不能为空！").notNull();
        check(store_id, "保存失败，门店不能为空！").notNull();
        check(repeal_id, "保存失败，退款关联交易单不能为空！").notNull();
        var postObj = {type:type, state:state, store_id:store_id, payment:payment, cash:cash, point:point,
            pay_type:pay_type, deal_items:deal_items, repeal_id:repeal_id, customer_id:customer_id, create_time:getNow()};
        saveDealAndDealItems(postObj,res,next);
    }catch(e){
        return res.json({status:400, error:e.message}, 400);
    }
};

exports.deleteDeal = function(req, res, next) {
    console.log("开始进行删除。。。。");
    if(!req.session.user.member.org_id) return res.json({error:'未登录或当前用户不是商户员工!'}, 400);
    var _ids = req.params._ids;
    try {
        check(_ids, "删除失败，删除数据的流水号不能为空！").notNull();

        Deal.delete(_ids, function(err,ds){
            if(err) return next(err);
            Deal_item.delete({deal_id:_ids}, function(err, info){
                if(err) return next(err);
                return res.json({deal:{_ids:_ids}}, 202);
            });
        });
    }catch(e){
        res.json({status:400, error:e.message}, 400);
    }
}

exports.updateDeal = function(req,res,next) {
    console.log("updateDeal。。。");
    if(!req.session.user.member.org_id) return res.json({error:'未登录或当前用户不是商户员工!'}, 400);

    //开始校验输入数值的正确性
    var _id = req.body._id;
    var type = req.body.type;
    var state = req.body.state;
    var store_id = req.body.store_id;
    var payment = sanitize(req.body.payment).ifNull(0.00);
    var cash = sanitize(req.body.cash).ifNull(0.00);
    var point = sanitize(req.body.point).ifNull(0.00);
    var pay_type = req.body.pay_type;
    var deal_items = req.body.deal_items;
    var repeal_id = req.body.repeal_id;
    var customer_id = req.body.customer_id;

    var ep = EventProxy.create();

    //回调函数
    function feedback(result) {
        if(200 == result.status) {
            if(result.jsonObj) {
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

    ep.on('dealUpdate', function(obj) {
        dealUpdate(obj);
    });

    ep.on('deleteDealItem', function(obj) {
        deleteDealItem(obj);
    });

    ep.on('createDealItems', function(obj) {
        createDealItems(obj);
    });


    function deleteDealItem(obj){
        Deal_item.delete({deal_id:obj._id}, function(err, info){
            if(err) return next(err);
            ep.trigger('createDealItems', obj);
        });
    };

    function createDealItems(obj){
//        var returnObj = {deal:{_id:_id, deal_items:[]}};
        var returnObj = {_id:_id};
        var i = 0;
        obj.deal_items.forEach(function(item) {
            item.deal_id = obj._id;
            Deal_item.create(item, function(err, info) {
                if(err) return next(err);
                if(!info || !info.insertId) return res.json({error:'数据入库出错!'}, 500);
                //returnObj.deal.deal_items[i]={_id:info.insertId}; //////
                i++;
                ep.trigger('done', obj);
            });
        });

        ep.after('done', obj.deal_items.length, function(obj) {
            return res.json(returnObj, 200);
        });
    };

    function dealUpdate(obj){
        Deal.update(obj, function(err, info){
            if(err) return next(err);
            ep.trigger('deleteDealItem', obj);
        });
    };

    if(!deal_items || !deal_items.length || deal_items.length <= 0) return res.json({status:400, error:"保存失败，交易明细不能为空！"}, 400);

    try {
        check(_id, "更新失败，交易ID不能为空！").notNull();
        check(type, "更新失败，交易类型不能为空！").notNull();
        check(state, "更新失败，交易状态不能为空！").notNull();
        check(store_id, "更新失败，门店不能为空！").notNull();

        var putObj = {_id:_id, type:type, state:state, store_id:store_id, payment:payment, cash:cash, point:point,
            pay_type:pay_type, repeal_id:repeal_id, deal_items:deal_items, customer_id:customer_id};

        ep.trigger('dealUpdate', putObj);
    }catch(e){
        return res.json({status:400, error:e.message}, 400);
    }
//    var json = {};
//    json.deal = {};
//    var deal_item = req.body.deal_item;
//    req.body._id = req.params.id;
//    json.deal.lid = req.body.lid;
//    delete req.body.deal_item;
//    delete req.body.lid;
//    req.body.dealer_id = req.session.user._id;
//    var ep = EventProxy.create();
//    var feedback = function(result) {
//	    if(201 == result.status) {
//	        res.json(result.json, result.status);
//        }
//        else {
//	        res.end(result.status);
//	    }
//    }
//    Deal.update(req.body, function(err, info) {
//        if(err) {
//	        feedback({status: 400});
//	    }
//	    else {
//            json.deal._id = req.body._id;
//            json.deal.deal_item = [];
//
//            ep.after('deal_item', deal_item.length, function(data) {
//		        feedback({status: 201, json: json});
//            });
//            deal_item.forEach(function(item) {
//	            Deal_item.update(item, function(err, info2) {
//	                if(err) {
//		                feedback({status: 400});
//		            }
//		            else {
//		                json.deal.deal_item.push({
//			                _id:item._id,
//			                lid:info2.lid,
//			                deal_id:req.body._id});
//		            }
//			        ep.trigger('deal_item');
//		        });
//		    });
//	    }
//	});
};
