var models = require('../models');
var User = models.User;
var Role = models.Role;
var Member = models.Member;
var Merchant = models.Merchant;

var check = require('validator').check;
var sanitize = require('validator').sanitize;

var crypto = require('crypto');
var bcrypt = require('bcrypt');  

var config = require('../config').config;
var EventProxy = require('eventproxy').EventProxy;

var Log = require('../log.js');
var log = Log.create(Log.INFO, {'file':'public/node.debug'});
var MQClient = require('../libs/mq_client.js');

var util = require('../libs/util.js');

var getNow=function(){
    var now = new Date();
    var year = now.getFullYear();
    return (year+'-'+(now.getMonth()+1)+'-'+now.getDate()+' '+
        now.getHours()+':'+now.getMinutes()+':'+now.getSeconds());
};

/** for review 
*  以下到getShowElement的部分完全可以放置在客户端脚本
*/
/**
 * 开始设置前台表格控件说需要的相关对象及参数Start
 */
//设置查询区域的查询输入框，规则：{"查询字段名":"页面显示的label文字"}
var queryInput = {'_id':'编号','comment':'备注'};
//设置前台页面显示的表格列头
var colNames = ['编号', '昵称', '商户','角色名称','状态','创建时间','到期时间'];
//设置前台页面显示的表格数据
var colModel = [
    {name:'ef_member._id',index:'ef_member._id', width:100, align:'center',sortable:true},
    {name:'ef_member.pet_name',index:'ef_member.pet_name', width:150, align:'center',sortable:false},
    {name:'ef_merchant.short_name',index:'ef_merchant.short_name', width:200,align:'center',sortable:false},
    {name:'ef_role.name',index:'ef_role.name', width:200, align:'center',sortable:false},
    {name:'ef_member.state',index:'ef_member.state', width:200, align:'center',sortable:true,formatter:'select',
        editoptions:{value:'0:禁用;1:启用;2:脱离'}},
    {name:'ef_member.create_time',index:'ef_member.create_time', width:300, align:'center',sortable:true,
        formatter : 'date', formatoptions : {srcformat : 'Y-m-d H:i:s',newformat : 'Y-m-d H:i:s'}},
    {name:'ef_member.due_time',index:'ef_member.due_time', width:300, align:'center',sortable:true,
        formatter : 'date', formatoptions : {srcformat : 'Y-m-d H:i:s',newformat : 'Y-m-d H:i:s'}}];

//设置前台页面所要显示的数据字段,用于数据筛选
var showElement = getShowElement();
//同上
function getShowElement(){
    var ar = new Array();
    for(var i=0; i<colModel.length; i++){
        ar[i] = colModel[i].name;
    }
    return ar;
}
////设置前台表格控件说需要的相关对象及参数End

/**
 * 显示员工列表
 * @param req
 * @param res
 * @param next
 */
exports.index = function(req,res,next){
    if(req.accepts('html')) {
        res.render('member/index', {queryInput:queryInput, colModel:colModel, colNames:colNames});
    }else{
        var ep = EventProxy.create();

/** for review 
*  where的脚本应该放到model中去，这样写在controller中耦合行高，例如将来数据库换为mongodb或者在数据持久层中间需要加入中间出来model的时候就需要解耦。
*  req.query直接作为参数丢给model。
*/
        //根据前台页面传入的查询条件，开始拼接where语句
        var where = ' ';
        for(key in queryInput){
            var value = req.query[key];
            if(value != undefined){
                where += ' and '+key+' like \'%'+value+'%\' ';
            }
        }

        //回调函数
        function feedback(result) {
            if(200 == result.status) {
                if(result.jsonObj) {
                    var jsonStr = JSON.stringify(result.jsonObj);
                    console.log('jsonStr:'+jsonStr);
                    res.json(result.jsonObj, result.status);
                }else{
                    ep.trigger('error', {status:204, error:'查询结果为空!'});
                }
            }
            else {
                res.json(result.status);
            }
        };
        //当有异常发生时触发
        ep.once('error', function(result) {
            ep.unbind();//remove all event
            return feedback(result);
        });
        //查询当前所有会员的信息，在此方法内部会关联user，role，merchant表，并进行分页处理
        ep.on('findAllMember', function(count) {
            findAllMember(count);
        });
        //将传入的json对象发布到前台页面进行表格展示。
        ep.on('showList', function(jsonObj) {
            feedback({status:200, error:'获取数据成功', jsonObj:jsonObj});
        });

/** for review 
*  获取总行数和获取当前分页的动作可以同时做，提前声明返回对象，在每个事件分别组装反馈的信息。
*/
        //获得数据行数，用于分页计算
        Member.count({where:where}, function(err, count) {
            if(err) { ep.unbind(); return next(err);}
            if (!count && !count.count) return ep.trigger('error', {status:204, error:'查询结果为空!'});
            ep.trigger('findAllMember', count.count);
        });

        function findAllMember(count) {
            //开始初始化查询条件
            var page = req.query.page; // 取得当前页数,注意这是jqgrid自身的参数
            var limit = req.query.rows; // 取得每页显示行数，,注意这是jqgrid自身的参数
            var sidx = req.query.sidx; //取得排序字段
            var sord  = req.query.sord;//排序方式asc、desc

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
            if (page > total_pages) page=total_pages;

            // 计算起始行
            var start = limit * page - limit;
            // 若起始行为0
            if(start < 0) start = 0;

            Member.findAll({where:where, start:start, limit:limit, sidx:sidx, sord:sord}, function(err, rs) {
                if(err) { ep.unbind(); return next(err);}
                if (!rs || rs == undefined) return ep.trigger('error', {status:204, error:'查询结果为空！'});
                for(var i=0; i<rs.length; i++){
                    for ( key in rs[i]) {
                        rs[i]["ef_member."+key] = rs[i][key];
                        delete rs[i][key];
                    }
                }
                //开始汇总
                ep.after('memberDone', rs.length, function() {
                    //当memberDone被触发rs.length次后，执行以下语句。
                    var jsonObj = new Object();
                    jsonObj.page = page;  // 当前页
                    jsonObj.total = total_pages;    // 总页数
                    jsonObj.records = count;  // 总记录数
                    var rowsArray = new Array();
                    //开始判断：如果rs中包含前台需要显示的数据（showElement包含的名称），则赋值给ay数组并开始拼装json对象。
                    for(var i=0; i<rs.length; i++){
                        // 定义rows
                        var rows = new Object();
                        rows.id = rs[i][Member.table+"._id"];
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
                    //console.log('jsonStr:'+jsonStr);
                    ep.trigger('showList', jsonObj);
                });

                //定义rows 数组，保存所有rows数据
                rs.forEach(function(member) {
                    var ep2 = EventProxy.create();
                    ep2.assign('UserDone', 'RoleDone', 'OrgDone', function(userEvent, roleEvent, orgEvent) {
                        ep.trigger('memberDone');
                    });
                    //console.log("memberid: "+member["ef_member.user_id"]);
                    User.findOne({'_id':member[Member.table+".user_id"]}, function(err, user) {
                        if(err) { ep2.unbind(); return next(err);}
                        if (!user || user == undefined) return ep2.trigger('error', {status:204, error:'查询User结果为空！'});

                        for ( key in user ) {
                            member[User.table+"."+key] = user[key];
                        }
                        ep2.trigger('UserDone', member);

                    });
                    Role.findOne({'role':member[Member.table+".role_id"]}, function(err, role) {
                        if(err) { ep2.unbind(); return next(err);}
                        if (!role || role == undefined) return ep2.trigger('error', {status:204, error:'查询Role结果为空！'});

                        for ( key in role ) {
                            member[Role.table+"."+key] = role[key];
                        }
                        ep2.trigger('RoleDone', member);

                    });
                    Merchant.findOne({'_id':member[Member.table+".org_id"]}, function(err, merchant) {
                        if(err) { ep2.unbind(); return next(err);}
                        if (!merchant || merchant == undefined) return ep2.trigger('error', {status:204, error:'查询Merchant结果为空！'});

                        for ( key in merchant ) {
                            member[Merchant.table+"."+key] = merchant[key];
                        }
                        ep2.trigger('OrgDone', member);
                    });
                });
            });
        };
    }
};

/**
 * 显示新增员工（无_id）,或已有员工（有_id）页面
 * @param req
 * @param res
 * @param next
 * @return {*}
 */
exports.showMember = function(req, res, next) {
/** for review
    需要面向get member做整合，提供html和json，将memberRegJudge和findMemberByCellphone功能合并进来。
    先查出数据，然后再考虑rend，对于accept html必须返回html，即使是error。
*/
    console.log("开始显示 新建||编辑||查看 弹出框。。。");
    var _id = req.params._id;
    var isEdit = req.params.isEdit?req.params.isEdit:"false";
    // 本页面有3个状态： 新增， 查看， 编辑
    // - 新增(pageState=0)： _id 为空，isReadonly=false, 所有输入框为空，显示：保存按钮
    // - 查看(pageState=1)： _id不为空，isReadonly=true， 输入框有数据，显示：关闭按钮
    // - 编辑(pageState=2)： _id不为空，isReadonly=false， 输入框有数据，显示：保存按钮 + 关闭按钮
    var pageState = 2;

    var ep = EventProxy.create();

    //当有异常发生时触发
    ep.once('error', function(result) {
        ep.unbind();//remove all event
        return feedback(result);
    });
    //查询当前ID会员的信息
    ep.on('findUser', function(memberId) {
        findUser(memberId);
    });
    //查询所有权限，用于下拉列表
    ep.on('findAllRoles', function() {
        findAllRoles();
    });

    ep.assign('UserDone', 'RoleDone', 'MemberDone', function(user, roles, member) {
        if(member){
            console.log("---------------"+user+" --- "+roles+" --- "+member);
            //查看&编辑
            res.render('member/member',
                { layout: false, pageState:pageState, user:user, member:member, roles:roles, method:'put'});
        }else{
            //新建
            res.render('member/member',
                { layout: false, pageState:pageState, roles:roles, method:'post'});
        }
    });

    //回调函数
    function feedback(result) {
        if(200 == result.status) {
            if(result.jsonObj) {
                res.json(result.jsonObj, result.status);
            }else{
                ep.trigger('error', {status:204, error:'查询结果为空!'});
            }
        }
        else {
            res.json(result.status);
        }
    };

    function findAllRoles(){
        Role.findAll({},function(err, ds){
            if(err) return next(err);
            return ep.trigger("RoleDone", ds);
        });
    };

    function findUser(memberId){
        User.findOne({"_id":memberId},function(err, ds){
            if(err) return next(err);
            return ep.trigger("UserDone", ds);
        });
    };

    //如果_id不为空，则弹出编辑页面
    if(_id){
        //编辑 和 查看
        if(!isEdit || isEdit != "true"){
            //查看状态
            pageState = 1;
        }

        Member.findOne({"_id":_id}, function(err,ds){
            if(err) return next(err);
            ep.trigger("findUser", ds.user_id);
            ep.trigger("findAllRoles");//获得角色列表
            ep.trigger("MemberDone", ds);
        });
    }else{
        //新增
        pageState = 0;
        ep.trigger("UserDone");
        ep.trigger("findAllRoles");//获得角色列表
        ep.trigger("MemberDone");
    }
};



exports.saveMember = function(req,res,next){
    console.log("saveMember。。。");
/** for review
    var memberObj = req.body;
*/
    //开始校验输入数值的正确性
    var pet_name = req.body.pet_name;
    var cellphone = req.body.cellphone;
    var role_id = req.body.role_id;
    var state = req.body.state;
    var sex = req.body.sex;
    var birthday = req.body.birthday;
    var due_time = req.body.due_time;
    var user_id = req.body.user_id;

    var ep = EventProxy.create();

    ep.on('creatMember', function(data) {
        creatMember(data);
    });

    //回调函数
    function feedback(result) {
        res.json(result);
    };

    function creatMember(data){
        Member.create(data, function(err, info){
            if(err) return next(err);
            feedback({status:200, error:'添加员工信息成功!'});
        });
    };
    //当有异常发生时触发
    ep.once('error', function(result) {
        ep.unbind();//remove all event
        return feedback(result);
    });

    if(!pet_name) return ep.trigger('error', {status:204, error:'昵称不能为空!'});
    if(!cellphone) return ep.trigger('error', {status:204, error:'手机号码不能为空!'});
    //if(!password) return ep.trigger('error', {status:204, error:'登陆密码不能为空!'});
    if(!role_id) return ep.trigger('error', {status:204, error:'角色不能为空!'});
    if(!state) return ep.trigger('error', {status:204, error:'状态不能为空!'});
    if(!due_time) return ep.trigger('error', {status:204, error:'到期时间不能为空!'});

    //判断是否需要新建user
    if(user_id){
        //不需要新建用户
        ep.trigger("creatMember", {"user_id":user_id, "org_id":1, "pet_name":pet_name, "role_id":role_id, "state":state, "create_time":getNow(), "due_time":due_time});
    }else{
        //新建用户，创建默认密码并对密码进行加密
        var salt = bcrypt.genSaltSync(10);
        var pass = bcrypt.hashSync("123456", salt);
        User.create({"name":pet_name, "pet_name":pet_name, "cellphone":cellphone, "password":pass, "state":"1", "sex":sex, "birthday":birthday, "create_time":getNow()}, function(err, info){
            if(err) return next(err);
            ep.trigger("creatMember", {"user_id":info.insertId, "org_id":1, "pet_name":pet_name, "role_id":role_id, "state":state, "create_time":getNow(), "due_time":due_time});
        });
    }

};

exports.updateMember = function(req,res,next){
    console.log("updateMember。。。");
    //开始校验输入数值的正确性
    var _id = req.body._id;
    var pet_name = req.body.pet_name;
    var role_id = req.body.role_id;
    var state = req.body.state;
    var due_time = req.body.due_time;
    var user_id = req.body.user_id;
    var sex = req.body.sex;
    var birthday = req.body.birthday;

    if(!_id) return res.json({status:204, error:'更新失败，数据流水号为空！'});
    if(!pet_name) return res.json({status:204, error:'更新失败，昵称不能为空！'});
    if(!role_id) return res.json({status:204, error:'角色不能为空!'});
    if(!state) return res.json({status:204, error:'状态不能为空!'});
    if(!due_time) return res.json({status:204, error:'到期时间不能为空!'});
    if(!user_id) return res.json({status:204, error:'会员ID不能为空!'});

    if(_id){
        //说明是更新数据
        Member.update({"_id":_id, "pet_name":pet_name, "role_id":role_id, "state":state, "due_time":due_time}, function(err,info){
            if(err) return next(err);
            res.json({status:200, error:'添加员工信息成功!'});
        });
    }
};

exports.deleteMember = function(req,res,next){
    //开始校验输入数值的正确性
    console.log("开始进行删除。。。。");
    var _ids = req.params._ids;
    Member.delete(_ids, function(err,ds){
        if(err) return next(err);
        return res.json({status:200, _ids:_ids, error:'删除员工信息成功!'});
    });
};

/**
 * 通过手机号码判断是否允许创建员工信息
 * 返回：
 *  400-说明请求参数有错
 *  202-说明user表中无cellphone->创建member and 创建user
 *  404-说明user表有cellphone，但member表中没有与user关联的数据->创建member and 关联user_id
 *  405-说明user和member中都有数据，->不允许创建。
 * @param req
 * @param res
 * @param next
 */
exports.memberRegJudge = function(req,res,next){
    console.log("memberRegJudge.....");
    var cellphone = req.params.cellphone;
    if(!cellphone) res.json({status:400, error:'手机号码不能为空！'});

    //首先，判断会员表中是否包含此手机号码
    User.findOne({loginname:cellphone},function(err,user){
        if(err) return next(err);
        if(!user) return res.json({status:202, error:'此手机号码尚未注册为会员，允许注册！'});//202 Accepted

        //如果user表中有相同号码的会员（user_id），则判断member表中是否包含此user_id
        Member.findOne({"user_id":user._id}, function(err, member){
            if(err) return next(err);
            console.log(member);
            if(!member) return res.json({status:404, error:'此会员尚未创建员工信息，允许创建员工！'});//404 Not Found
            return res.json({status:405, member:member});//405 Method Not Allowed
        });
    });
};

exports.findMemberByUserid = function(req,res,next){
    console.log("findMemberByUserid.....");
    var user_id = req.params.user_id;
    if(!user_id) res.json({status:400, error:'会员ID不能为空！'});
    Member.findOne({user_id:user_id}, function(err, member){
        if(err) return next(err);
        if(!member) res.json({status:403, error:'获取用户的member失败！'});
        return res.json({status:200, member:member});
    });
};

exports.findMemberByCellphone = function(req,res,next){
    console.log("findMemberByCellphone.....");
    var cellphone = req.params.cellphone;
    if(!cellphone) res.json({status:400, error:'手机号码不能为空！'});
    console.log("cellphone:"+cellphone);
    User.findOne({loginname:cellphone},function(err,user){
        if(err) return next(err);
        console.log("user._id:"+user._id);

        if(!user && !user._id) res.json({status:403, error:'获取用户的user失败！'});
        console.log("开始查询member```");
        Member.findOne({user_id:user._id}, function(err, member){
            if(err) return next(err);
            console.log("11111```");
            if(!member) res.json({status:403, error:'获取用户的member失败！'});
            console.log("22222```");
            return res.json({status:200, member:member});
        });
    });
};