var models = require('../models'),
    Merchant = models.Merchant;

var check = require('validator').check,
    sanitize = require('validator').sanitize;

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

var queryInput = {'_id_01': '编号', 'short_name_01': '简称'};
var showElement = ['_id', 'short_name', 'state', 'type', 'phone', 'create_time', 'due_time'];
/**
 * 显示商户列表
 * @param req
 * @param res
 * @param next
 */
exports.index = function(req,res,next){
    log.info("显示商户管理列表页面.....");
    if(req.accepts('html')) {
        res.render('merchant/index', {queryInput:queryInput});
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

        //回调函数
        function feedback(result) {
            if(200 == result.status) {
                if(result.jsonObj) {
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

        //查询当前所有交易的信息，在此方法内部会关联user，role，merchant表，并进行分页处理
        ep.on('findCount', function(where) {
            findCount(where);
        });

        ep.on('findAll', function(where) {
            findAll(where);
        });

        ep.on('findAllForWeb', function(where, count) {
            findAllForWeb(where, count);
        });

        //查询当前登陆用户所属商户
        //  首先获取当前登陆用户的org_id，查询当前用户的商户id
        if(req.session.user.member){
            //判断当前请求的是客户端还是web端
            var isWeb = req.query.isWeb;
            //开始检查传入参数
            try{
                check(isWeb).notNull().isInt();
                if(isWeb == 1){
                    ep.trigger('findCount', where);
                }else{
                    ep.trigger('findAll', where);
                }
            }catch(e){
                ep.trigger('findAll', where);
            }
        }else{
            ep.trigger('error', {status:400, error:'获取用户信息失败。'});
        }

        //查询总数
        function findCount(where){
            //获得数据行数，用于分页计算
            Merchant.count({where:where, bt:bt, et:et}, function(err, count) {
                if(err) { ep.unbind(); return next(err);}
                if (!count && !count.count) return ep.trigger('error', {status:400, error:'总数查询结果为空!'});
                ep.trigger('findAllForWeb', where, count.count);
            });
        }

        //转为web服务
        function findAllForWeb(where, count) {
            if (!count && !count.count) return ep.trigger('error', {status:400, error:'交易数量查询结果为空!'});

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

            Merchant.findAll({where:where, start:start, limit:limit, sidx:sidx, sord:sord, bt:bt, et:et}, function(err, rs) {
                if(err) { ep.unbind(); return next(err);}
                if (!rs || rs == undefined) return ep.trigger('error', {status:400, error:'商户查询结果为空！'});

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
//                log.info('jsonStr2:'+jsonStr);
                log.info('findAllForWeb-Json:'+jsonStr);
                return res.json(jsonObj, 200);
            });
        };

        function findAll(where) {
            //start=起始行数&limit=每页显示行数&bt=交易发生时间起点&et=交易发生时间的截至时间&sidx=排序字段名&sord=排序方式asc,desc
            Merchant.findAll({where:where, start:start, limit:limit, sidx:sidx, sord:sord, bt:bt, et:et}, function(err, rs) {
                if(err) { ep.unbind(); return next(err);}
                if (!rs || rs == undefined) return ep.trigger('error', {status:400, where:where, error:'查询结果为空！'});
                var jsonObj = {merchants:rs};
                feedback({status:200, error:'获取数据成功', jsonObj:jsonObj});
            });
        };
    }
};



//exports.index2 = function(req,res,next){
//    if(req.accepts('html')) {
//      res.render('merchants/merchants', {queryInput: queryInput});
//    }else{
//        Merchant.count(function(err,ds){
//            if(err) return next(err);
//
//            var page = req.query.page; // 取得当前页数,注意这是jqgrid自身的参数
//            var limit = req.query.rows; // 取得每页显示行数，,注意这是jqgrid自身的参数
//            var sidx = req.query.sidx; //取得排序字段
//            var sord = req.query.sord;//排序方式asc、desc
//
//            if(!sidx){
//                sidx = 1;
//            }
//            // 计算查询结果总行数
//            var count = ds[0].count;
//            // 查询结果总页数
//            var total_pages = 0;
//
//            // 计算查询结果页数
//            if(count > 0 && limit > 0){
//                total_pages = Math.ceil(count/limit);
//            }
//            // 若请求页大于总页数，设置请求页为最后一页
//            if (page > total_pages) page=total_pages;
//
//            // 计算起始行
//            var start = limit * page - limit;
//            // 若起始行为0
//            if(start < 0) start = 0;
//
//            var where = ' ';
//            for(key in queryInput) {
//                var value = req.query[key];
//                if(value != undefined) {
//                    where += ' and '+key+' like \'%'+value+'%\' ';
//                }
//            }
//
//            Merchant.findAll({where:where, start:start, limit:limit, sidx:sidx, sord:sord}, function(err,ds) {
//                if(err) return next(err);
//                //-------------------------------------------
//                if (!ds || ds == undefined){
//                    return res.json({status:'查询结果为空！'}, 204);
//                }
//
//                var jsonObj = new Object();
//                jsonObj.page = page;  // 当前页
//                jsonObj.total = total_pages;    // 总页数
//                jsonObj.records = count;  // 总记录数
//
//                //定义rows 数组，保存所有rows数据
//                var rowsArray = new Array();
//
//                for(var i=0; i<ds.length; i++){
//                    // 定义rows
//                    var rows = new Object();
//                    rows.id = ds[i]._id;
//                    ds[i].create_time = formatDate(ds[i].create_time);
//                    ds[i].due_time = formatDate(ds[i].due_time);
//                    rows.cell = [ds[i]._id, ds[i].short_name, ds[i].state, ds[i].type, ds[i].phone, ds[i].create_time, ds[i].due_time];
//                    rowsArray[i] = rows;
//                }
//                //将rows数组赋予jsonObj.rows
//                jsonObj.rows = rowsArray;
//                //-------------------------------------------
//
//                var jsonStr = JSON.stringify(jsonObj);
//                log.info('jsonStr:'+jsonStr);
//                return res.json(jsonObj);
//            });
//        });
//    };
//};

exports.pageNew = function(req, res, next) {
    log.info("新建弹出框。。。");
    // 3个状态： 新增， 查看， 编辑
    // - 新增(pageState=0)： _id 为空，isReadonly=false, 所有输入框为空，显示：保存按钮
    // - 查看(pageState=1)： _id不为空，isReadonly=true， 输入框有数据，显示：关闭按钮
    // - 编辑(pageState=2)： _id不为空，isReadonly=false， 输入框有数据，显示：保存按钮 + 关闭按钮
    var pageState = 0;
    res.render('merchant/merchant', { layout: false, pageState:pageState});
};

/**
 * 显示新增商品（无_id）,或已有商品（有_id）页面
 * @param req
 * @param res
 * @param next
 * @return {*}
 */
exports.pageView = function(req, res, next) {
    log.info("开始 pageView 。。。");
    var _id = req.params._id;
    // 本页面有3个状态： 新增， 查看， 编辑
    // - 新增(pageState=0)： 所有输入框为空，显示：保存按钮
    // - 查看(pageState=1)： 输入框有数据，显示：关闭按钮
    // - 编辑(pageState=2)： 输入框有数据，显示：保存按钮 + 关闭按钮
    var pageState = 1;
    try {
        check(_id, "流水号不能为空！").notNull();
        res.render('merchant/merchant', { layout: false, _id:_id, pageState:pageState});
    }catch(e){
        res.json({status:400, error:e.message}, 400);
    }
};

exports.pageEdit = function(req, res, next) {
    log.info("开始 pageEdit 。。。");
    var _id = req.params._id;
    // 本页面有3个状态： 新增， 查看， 编辑
    // - 新增(pageState=0)： 所有输入框为空，显示：保存按钮
    // - 查看(pageState=1)： 输入框有数据，显示：关闭按钮
    // - 编辑(pageState=2)： 输入框有数据，显示：保存按钮 + 关闭按钮
    var pageState = 2;
    try {
        check(_id, "流水号不能为空！").notNull();
        res.render('merchant/merchant', { layout: false, _id:_id, pageState:pageState});
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
    log.info("开始 findOne 。。。");
    var _id = req.params._id;

    try {
        check(_id, "流水号不能为空！").notNull();
        Merchant.findOne({_id: _id}, function(err, data) {
            if(err) return next(err);
            if(!data) return res.json({status:400, error:"查询结果为空!"}, 400);
            var jsonObj = {merchant:data};
            return res.json(jsonObj, 200);
        });
    }catch(e){
        res.json({status:400, error:e.message}, 400);
    }
};


/**
 * 获得商户列表List
 * @param req
 * @param res
 * @param next
 */
//exports.getList = function(req,res,next){
//    Merchant.findAll({}, function(err,ds){
//        if(err) return next(err);
//        if(!ds || ds.length)  return res.json({status:204, error:'查询结果为空！'});
//        return res.json({status:200, merchants:ds});
//    });
//};

exports.saveMerchant = function(req,res,next){
    log.info("saveMerchant。。。");
    if(!req.session.user.member) return res.json({error:'未登录!'}, 400);

    //开始校验输入数值的正确性
    var short_name = sanitize(req.body.short_name).trim();
    var full_name = sanitize(req.body.full_name).trim();
    var state = req.body.state;
    var type = req.body.type;
    var logo_img_path = sanitize(req.body.logo_img_path).ifNull("");
    var charter_num = sanitize(req.body.charter_num).trim();
    var charter_img_path = sanitize(req.body.charter_img_path).trim();
    var create_time = getNow();
    var due_time = sanitize(req.body.due_time).trim();
    var address = sanitize(req.body.address).ifNull("");
    var website = sanitize(req.body.website).ifNull("");
    var phone = sanitize(req.body.phone).trim();
    var fax = sanitize(req.body.fax).trim();
    var self_intro = sanitize(req.body.self_intro).ifNull("");
    var member_intro = sanitize(req.body.member_intro).ifNull("");
    var district_code = sanitize(req.body.district_code).trim();
    var merchant_level_id = req.body.merchant_level_id;
    var comment = sanitize(req.body.comment).ifNull("");

    try {
        check(short_name, "保存失败，商户简称不能为空！").notNull();
        check(state, "保存失败，状态不能为空！").notNull();
        check(type, "保存失败，类型不能为空！").notNull();
        check(charter_num, "保存失败，营业执照号不能为空！").notNull();
        check(due_time, "保存失败，到期时间不能为空！").notNull();
        check(district_code, "保存失败，地区编号不能为空！").notNull();
        check(merchant_level_id, "保存失败，商户等级不能为空！").notNull();

        var where = "and short_name = '"+short_name + "'";
        Merchant.findAll({where: where}, function(err, rs) {
            if(err) return next(err);
            if(!rs) {
                var jsonObj = {short_name:short_name, full_name:full_name, state:state, type:type, logo_img_path:logo_img_path,
                    charter_num:charter_num, charter_img_path:charter_img_path, create_time:create_time, due_time:due_time,
                    address:address, website:website, phone:phone, fax:fax, self_intro:self_intro, member_intro:member_intro,
                    district_code:district_code, merchant_level_id:merchant_level_id, comment:comment};

                Merchant.create(jsonObj, function(err, info){
                    if(err) return next(err);
                    if(!info || !info.insertId) return res.json({error:'数据入库出错!'}, 500);
                    var returnObj = {_id:info.insertId};
                    return res.json(returnObj, 201);
                });
            }
            else {
                return res.json({status: 500, error:'该商户简称已存在!', merchant:rs[0]}, 500);
            }
        });
    }catch(e){
        res.json({status:400, error:e.message}, 400);
    }
};

//exports.create = function(req, res, next) {
//    log.info("保存并新增商户数据******");
//    //开始校验输入数值的正确性
//    /*
//    var short_name = sanitize(req.body.short_name).trim();
//    var full_name = sanitize(req.body.full_name).trim();
//    var state = sanitize(req.body.state).trim();
//    var type = sanitize(req.body.type).trim();
//    var logo_img_path = sanitize(req.body.logo_img_path).trim();
//    var charter_num = sanitize(req.body.charter_num).trim();
//    var charter_img_path = sanitize(req.body.charter_img_path).trim();
//    var address = sanitize(req.body.address).trim();
//    var website = sanitize(req.body.website).trim();
//    var phone = sanitize(req.body.phone).trim();
//    var fax = sanitize(req.body.fax).trim();
//    var self_intro = sanitize(req.body.self_intro).trim();
//    var member_intro = sanitize(req.body.member_intro).trim();
//    var district_code = sanitize(req.body.district_code).trim();
//    var merchant_level_id = sanitize(req.body.merchant_level_id).trim();
//    var comment = sanitize(req.body.comment).trim();
//    var create_time = getNow();
//    var due_time = sanitize(req.body.due_time).trim();
//    */
//    //Merchant.create(merchant);
//    var where = 'and short_name = '+req.body.short_name;
//
//    Merchant.findAll({where: where}, function(err, rs) {
//    	if(err) return next(err);
//    	if(!rs) {
//            Merchant.create(req.body, function(err, info){
//                if(err) return next(err);
//                //req.body.create_time = getNow();
//                res.send({status:201, error:'添加商户信息成功!', merchant: {_id: info.insertId}}, 201);
//            });
//        }
//        else {
//        	res.send({status: 404, error:'该商户简称已存在!'});
//        }
//    });
//};

exports.deleteMerchant = function(req,res,next) {
    log.info("开始进行删除。。。。");
//	var _ids = req.params.id;
//	Merchant.delete(_ids, function(err, rs) {
//		if(err) return next(err);
//		return res.json({"status":202, "error":'删除商户信息成功!', "_ids":_ids}, 202);
//	});
    if(!req.session.user.member) return res.json({error:'未登录!'}, 400);

    var _ids = req.params._ids;

    try {
        check(_ids, "删除失败，删除数据的流水号不能为空！").notNull();

        Merchant.delete(_ids, function(err,ds){
            if(err) return next(err);
            return res.json({merchant:{_ids:_ids}}, 202);
        });
    }catch(e){
        res.json({status:400, error:e.message}, 400);
    }
}

//exports.editMerchant = function(req,res,next) {
//	var _id = req.body._id;
//	if(!_id) return res.json({status:400, error:'更新失败，数据流水号为空!'});
//	if(_id) {
//	    Merchant.update(req.body, function(err) {
//		    if(err) return next(err);
//		    res.json({status:201, error:'更新商户信息成功!'});
//	    });
//	}
//};

exports.updateMerchant = function(req,res,next){
    log.info(" ---------开始 updateMerchant。。。");

    if(!req.session.user.member) return res.json({error:'未登录!'}, 400);

    //开始校验输入数值的正确性
    var _id = req.body._id;
    var short_name = sanitize(req.body.short_name).trim();
    var full_name = sanitize(req.body.full_name).trim();
    var state = req.body.state;
    var type = req.body.type;
    var logo_img_path = sanitize(req.body.logo_img_path).ifNull("");
    var charter_num = sanitize(req.body.charter_num).trim();
    var charter_img_path = sanitize(req.body.charter_img_path).trim();
    var create_time = getNow();
    var due_time = sanitize(req.body.due_time).trim();
    var address = sanitize(req.body.address).ifNull("");
    var website = sanitize(req.body.website).ifNull("");
    var phone = sanitize(req.body.phone).trim();
    var fax = sanitize(req.body.fax).trim();
    var self_intro = sanitize(req.body.self_intro).ifNull("");
    var member_intro = sanitize(req.body.member_intro).ifNull("");
    var district_code = sanitize(req.body.district_code).trim();
    var merchant_level_id = req.body.merchant_level_id;
    var comment = sanitize(req.body.comment).ifNull("");
    try {
        check(_id, "更新失败，数据流水号不能为空！").notNull();
        check(short_name, "更新失败，商户简称不能为空！").notNull();
        check(state, "更新失败，状态不能为空！").notNull();
        check(type, "更新失败，类型不能为空！").notNull();
        check(charter_num, "更新失败，营业执照号不能为空！").notNull();
        check(due_time, "更新失败，到期时间不能为空！").notNull();
        check(district_code, "更新失败，地区编号不能为空！").notNull();
        check(merchant_level_id, "更新失败，商户等级不能为空！").notNull();

        //说明是更新数据
        var jsonObj = {_id:_id, short_name:short_name, full_name:full_name, state:state, type:type, logo_img_path:logo_img_path,
            charter_num:charter_num, charter_img_path:charter_img_path, create_time:create_time, due_time:due_time,
            address:address, website:website, phone:phone, fax:fax, self_intro:self_intro, member_intro:member_intro,
            district_code:district_code, merchant_level_id:merchant_level_id, comment:comment};
        Merchant.update(jsonObj, function(err) {
            if(err) return next(err);
            var jsonObj = {merchant:_id};
            return res.json(jsonObj, 200);
        });
    }catch(e){
        res.json({status:400, error:e.message}, 400);
    }
};


//exports.showMerchant = function(req, res, next) {
//	if(req.accepts('html')) {
//		var _id = req.params.id;
//		var isEdit = req.params.isEdit?req.params.isEdit:"false";
//		// 本页面有3个状态： 新增， 查看， 编辑
//		// - 新增(pageState=0)： _id 为空，isReadonly=false, 所有输入框为空，显示：保存按钮
//		// - 查看(pageState=1)： _id不为空，isReadonly=true， 输入框有数据，显示：关闭按钮
//		// - 编辑(pageState=2)： _id不为空，isReadonly=false， 输入框有数据，显示：保存按钮 + 关闭按钮
//		var pageState = 2;
//
//		//如果_id不为空，则弹出编辑页面
//		if(_id) {
//			//编辑 和 查看
//			if(!isEdit || isEdit != "true") {
//				//查看状态
//				pageState = 1;
//			}
//
//			Merchant.findOne({"_id": _id}, function(err, rs) {
//				if(err) return next(err);
//				rs.create_time = formatDate(rs.create_time);
//				rs.due_time = formatDate(rs.due_time);
//				res.render('merchants/create', {layout: false, merchant: rs, pageState: pageState, method: 'put'});
//			});
//		} else {
//			//新增
//			pageState = 0;
//			res.render('merchants/create', {layout: false, pageState: pageState, method: 'post'});
//		}
//    }
//    else {
//    	var _id = req.params.id;
//    	if(_id) {
//    		Merchant.findOne({"_id": _id}, function(err, rs) {
//    		    if(err) return next(err);
//    		    res.json({merchant: rs}, 200);
//    		});
//    	}
//    	else {
//    		Merchant.findAll({}, function(err, rs) {
//    			if(err) return next(err);
//    		    res.json({merchant: rs}, 200);
//    		});
//        }
//    }
//};

//var getNow=function(){
//    var now = new Date();
//    var year = now.getFullYear();
//    return (year+'-'+(now.getMonth()+1)+'-'+now.getDate()+' '+
//        now.getHours()+':'+now.getMinutes()+':'+now.getSeconds());
//};

var formatDate = function(date) {
	if(!date || date =='Invalid Date') {
		return '';
    }
	else {		
		var year = date.getFullYear();
		return (year + '-' + (date.getMonth() + 1) + '-' + date.getDate() + ' ' + date.getHours() + ':' + date.getMinutes() + ':' + date.getSeconds());              
    }	
}
