var models = require('../models');var User = models.User;var Role = models.Role;var Member = models.Member;var Merchant = models.Merchant;var check = require('validator').check;var sanitize = require('validator').sanitize;var crypto = require('crypto');var bcrypt = require('bcrypt');  var config = require('../config').config;var EventProxy = require('eventproxy').EventProxy;var Log = require('../log.js');var log = Log.create(Log.INFO, {'file':'public/node.debug'});var MQClient = require('../libs/mq_client.js');/** * 开始设置前台表格控件说需要的相关对象及参数Start *///设置查询区域的查询输入框，规则：{"查询字段名":"页面显示的label文字"}var queryInput = {'_id':'编号','comment':'备注'};//设置前台页面显示的表格列头var colNames = ['编号', '姓名', '商户','角色名称','昵称','状态','隐私权限','创建时间','到期时间','积分','储值','备注'];//设置前台页面显示的表格数据var colModel = [{name:'ef_member._id',index:'ef_member._id', width:100, align:'center',sortable:true},    {name:'ef_user.name',index:'ef_user.name', width:200, align:'center',sortable:true},    {name:'ef_merchant.short_name',index:'ef_merchant.short_name', width:200,align:'center',sortable:true},    {name:'ef_role.name',index:'ef_role.name', width:200, align:'center',sortable:true},    {name:'ef_user.pet_name',index:'ef_user.pet_name', width:150, align:'center',sortable:true},    {name:'ef_member.state',index:'ef_member.state', width:200, align:'center',sortable:true,formatter:'select',        editoptions:{value:'0:禁用;1:启用;2:脱离'}},    {name:'ef_member.privacy',index:'ef_member.privacy', width:200, align:'center',sortable:true,formatter:'select',        editoptions:{value:'0:不开放;1:基本信息开放;8:完全开放'}},    {name:'ef_member.create_time',index:'ef_member.create_time', width:300, align:'center',sortable:true,        formatter : 'date', formatoptions : {srcformat : 'Y-m-d H:i:s',newformat : 'Y-m-d H:i:s'}},    {name:'ef_member.due_time',index:'ef_member.due_time', width:300, align:'center',sortable:true,        formatter : 'date', formatoptions : {srcformat : 'Y-m-d H:i:s',newformat : 'Y-m-d H:i:s'}},    {name:'ef_member.point',index:'ef_member.point', width:150, align:'center',sortable:true},    {name:'ef_member.savings',index:'ef_member.savings', width:150, align:'center',sortable:true},    {name:'ef_member.comment',index:'ef_member.comment', width:150, align:'center',sortable:true}];//设置前台页面所要显示的数据字段,用于数据筛选var showElement = getShowElement();//同上function getShowElement(){    var ar = new Array();    for(var i=0; i<colModel.length; i++){        ar[i] = colModel[i].name;    }    return ar;}////设置前台表格控件说需要的相关对象及参数End/** * 显示员工列表 * @param req * @param res * @param next */exports.index = function(req,res,next){    if(req.accepts('html')) {        res.render('member/index', {queryInput:queryInput, colModel:colModel, colNames:colNames});    }else{        var ep = EventProxy.create();        //根据前台页面传入的查询条件，开始拼接where语句        var where = ' ';        for(key in queryInput){            var value = req.query[key];            if(value != undefined){                where += ' and '+key+' like \'%'+value+'%\' ';            }        }        //回调函数        function feedback(result) {            if(200 == result.status) {                if(result.jsonObj) {                    res.json(result.jsonObj, result.status);                }else{                    ep.trigger('error', {status:204, error:'查询结果为空!'});                }            }            else {                res.json(result.status);            }        };        //当有异常发生时触发        ep.once('error', function(result) {            ep.unbind();//remove all event            return feedback(result);        });        //查询当前所有会员的信息，在此方法内部会关联user，role，merchant表，并进行分页处理        ep.on('findAllMember', function(count) {            findAllMember(count);        });        //将传入的json对象发布到前台页面进行表格展示。        ep.on('showList', function(jsonObj) {            feedback({status:200, error:'获取数据成功', jsonObj:jsonObj});        });        //获得数据行数，用于分页计算        Member.count({where:where}, function(err, count) {            if(err) { ep.unbind(); return next(err);}            if (!count && !count.count) return ep.trigger('error', {status:204, error:'查询结果为空!'});            ep.trigger('findAllMember', count.count);        });        function findAllMember(count) {            //开始初始化查询条件            var page = req.query.page; // 取得当前页数,注意这是jqgrid自身的参数            var limit = req.query.rows; // 取得每页显示行数，,注意这是jqgrid自身的参数            var sidx = req.query.sidx; //取得排序字段            var sord  = req.query.sord;//排序方式asc、desc            if(!sidx){                sidx = 1;            }            // 查询结果总页数            var total_pages = 0;            // 计算查询结果页数            if(count > 0 && limit > 0){                total_pages = Math.ceil(count/limit);            }            // 若请求页大于总页数，设置请求页为最后一页            if (page > total_pages) page=total_pages;            // 计算起始行            var start = limit * page - limit;            // 若起始行为0            if(start < 0) start = 0;            Member.findAll({where:where, start:start, limit:limit, sidx:sidx, sord:sord}, function(err, rs) {                if(err) { ep.unbind(); return next(err);}                if (!rs || rs == undefined) return ep.trigger('error', {status:204, error:'查询结果为空！'});                for(var i=0; i<rs.length; i++){                    for ( key in rs[i]) {                        rs[i]["ef_member."+key] = rs[i][key];                        delete rs[i][key];                    }                }                //开始汇总                ep.after('memberDone', rs.length, function() {                    //当memberDone被触发rs.length次后，执行以下语句。                    var jsonObj = new Object();                    jsonObj.page = page;  // 当前页                    jsonObj.total = total_pages;    // 总页数                    jsonObj.records = count;  // 总记录数                    var rowsArray = new Array();                    //开始判断：如果rs中包含前台需要显示的数据（showElement包含的名称），则赋值给ay数组并开始拼装json对象。                    for(var i=0; i<rs.length; i++){                        // 定义rows                        var rows = new Object();                        rows.id = rs[i]["ef_member._id"];                        var ay = new Array();                        for(key in rs[i]){                            var index = showElement.indexOf(key);                            //console.log("======="+key+":"+rs[i][key]);                            if(index >= 0){                                ay[index] = rs[i][key];                            }                        }                        rows.cell = ay;                        rowsArray[i] = rows;                    }                    //将rows数组赋予jsonObj.rows                    jsonObj.rows = rowsArray;                    //var jsonStr = JSON.stringify(jsonObj);                    //console.log('jsonStr:'+jsonStr);                    ep.trigger('showList', jsonObj);                });                //定义rows 数组，保存所有rows数据                rs.forEach(function(member) {                    var ep2 = EventProxy.create();                    ep2.assign('UserDone', 'RoleDone', 'OrgDone', function(userEvent, roleEvent, orgEvent) {                        ep.trigger('memberDone');                    });                    //console.log("memberid: "+member["ef_member.user_id"]);                    User.findOne({'_id':member["ef_member.user_id"]}, function(err, user) {                        if(err) { ep2.unbind(); return next(err);}                        if (!user || user == undefined) return ep2.trigger('error', {status:204, error:'查询User结果为空！'});                        //for ( key in user ) {                        //    if(!member.hasOwnProperty(key)) member[key] = user[key];                        //}                        for ( key in user ) {                            member["ef_user."+key] = user[key];                            //console.log(">>>>>>>>>[member['ef_user."+key+"']:"+member["ef_user."+key]);                        }                        ep2.trigger('UserDone', member);                    });                    Role.findOne({'role':member["ef_member.role_id"]}, function(err, role) {                        if(err) { ep2.unbind(); return next(err);}                        if (!role || role == undefined) return ep2.trigger('error', {status:204, error:'查询Role结果为空！'});                        //for ( key in role ) {                        //    if(!member.hasOwnProperty(key)) member[key] = role[key];                        //}                        for ( key in role ) {                            member["ef_role."+key] = role[key];                        }                        ep2.trigger('RoleDone', member);                    });                    Merchant.findOne({'_id':member["ef_member.org_id"]}, function(err, merchant) {                        if(err) { ep2.unbind(); return next(err);}                        if (!merchant || merchant == undefined) return ep2.trigger('error', {status:204, error:'查询Merchant结果为空！'});                        //for ( key in merchant ) {                        //    if(!member.hasOwnProperty(key)) member[key] = merchant[key];                        //}                        for ( key in merchant ) {                            member["ef_merchant."+key] = merchant[key];                        }                        ep2.trigger('OrgDone', member);                    });                });            });        };    }};