var models = require('../models');
var User = models.User;
var Role = models.Role;
var Member = models.Member;
var Merchant = models.Merchant;
var RoleRoute = models.RoleRoute;
var Route = models.Route;

var check = require('validator').check;
var sanitize = require('validator').sanitize;

var crypto = require('crypto');
var bcrypt = require('bcrypt');  

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

/** for review 
*  以下到getShowElement的部分完全可以放置在客户端脚本
*/
/**
 * 开始设置前台表格控件说需要的相关对象及参数Start
 */
//设置查询区域的查询输入框，规则：{"查询字段名":"页面显示的label文字"}
var queryInput = {'_id_1':'编号','comment_1':'备注'};
////设置前台表格控件说需要的相关对象及参数End

/**
 * 显示员工列表
 * @param req
 * @param res
 * @param next
 */
exports.findAll = function(req,res,next){
    if(req.accepts('html')) {
        res.render('member/index', {queryInput:queryInput});
    }else{
        console.log("member - 获取所有商品信息。。。");
        //start=起始行数&limit=每页显示行数&bt=交易发生时间起点&et=交易发生时间的截至时间&sidx=排序字段名&sord=排序方式asc,desc
        var page = req.query.page; // 取得当前页数,注意这是jqgrid自身的参数
        var start = req.query.start;//起始行数
        var limit = req.query.limit;//每页显示行数
        var bt = req.query.bt;//交易发生时间起点
        var et = req.query.et;//交易发生截至时间
        var sidx = req.query.sidx;//排序字段名
        var sord = req.query.sord;//排序方式

        var ep = EventProxy.create();
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
                    //var jsonStr = JSON.stringify(result.jsonObj);
                    //console.log('jsonStr:'+jsonStr);
                    res.json(result.jsonObj, result.status);
                }else{
                    ep.trigger('error', {status:400, error:'查询结果为空!'});
                }
            }else {
                return res.json(result, result.status);
            }
        };
        //当有异常发生时触发
        ep.once('error', function(result) {
            ep.unbind();//remove all event
            return feedback(result);
        });
        ep.on('findMembersByRoleAndOrg', function(org_id) {
            findMembersByRoleAndOrg(org_id);
        });

        ep.on('findCount', function(where) {
            findCount(where);
        });

        //查询当前所有会员的信息
        ep.on('findAll', function(where) {
            findAll(where);
        });

        //查询当前所有会员的信息，在此方法内部会关联user，role，merchant表，并进行分页处理
        ep.on('findAllForWeb', function(where, count) {
            findAllForWeb(where, count);
        });
        //将传入的json对象发布到前台页面进行表格展示。
        ep.on('showList', function(jsonObj) {
            feedback({status:200, error:'获取数据成功', jsonObj:jsonObj});
        });

        //查询当前登陆用户所属商户
        //  首先获取当前登陆用户的org_id，查询当前用户的商户id
        if(req.session.user.member.org_id){
            ep.trigger('findMembersByRoleAndOrg', req.session.user.member.org_id);
        }else{
            ep.trigger('error', {status:400, error:'获取当前用户所属商户失败。'});
        }

        function findMembersByRoleAndOrg(org_id){
            where += " and org_id = "+org_id + " and role_id in (51,52) ";
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
        };

        function findCount(where) {
            console.log("---where:"+where);
            //获得数据行数，用于分页计算
            Member.count({where:where}, function(err, count) {
                if(err) { ep.unbind(); return next(err);}
                if (!count || !count.count || 0 == count.count) return ep.trigger('error', {status:400, error:'查询结果为空!'});
                console.log("---count.count:"+count.count);
                ep.trigger('findAllForWeb', where, count.count);
            });
        };

        function findAllForWeb(where, count) {
            console.log("---start findAllForWeb。");
            var showElement = ['_id', 'pet_name', 'merchant_short_name', 'role_name', 'state', 'create_time', 'due_time'];

            if (!count) return ep.trigger('error', {status:400, error:'查询结果为空!'});

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
            console.log("---start findAllForWeb2222。");

            Member.findAll({where:where, start:start, limit:limit, sidx:sidx, sord:sord, bt:bt, et:et}, function(err, rs) {
                if(err) { ep.unbind(); return next(err);}
                if (!rs || rs == undefined || 0 == rs.length) return ep.trigger('error', {status:400, error:'查询结果为空！'});
                console.log("---rs.length:"+rs.length);
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

                //定义rows 数组，保存所有rows数据
                rs.forEach(function(member) {
                    var ep2 = EventProxy.create();

                    ep2.assign('UserDone', 'RoleDone', 'OrgDone', function(userEvent, roleEvent, orgEvent) {
                        ep.trigger('memberDone');
                    });

                    User.findOne({'_id':member.user_id}, function(err, user) {
                        if(err) { ep2.unbind(); return next(err);}
                        if (!user || user == undefined) return ep2.trigger('error', {status:400, error:'查询User结果为空！'});
                        member.user_pet_name = user.pet_name;
                        ep2.trigger('UserDone', member);

                    });
                    Role.findOne({'_id':member.role_id}, function(err, role) {
                        if(err) { ep2.unbind(); return next(err);}
                        if (!role || role == undefined) return ep2.trigger('error', {status:400, error:'查询Role结果为空！'});
                        member.role_name = role.name;
                        ep2.trigger('RoleDone', member);

                    });
                    Merchant.findOne({'_id':member.org_id}, function(err, merchant) {
                        if(err) { ep2.unbind(); return next(err);}
                        if (!merchant || merchant == undefined) return ep2.trigger('error', {status:400, error:'查询Merchant结果为空！'});
                        member.merchant_short_name = merchant.short_name;
                        ep2.trigger('OrgDone', member);
                    });
                });
            });
        };

        function findAll(where) {
            //start=起始行数&limit=每页显示行数&bt=交易发生时间起点&et=交易发生时间的截至时间&sidx=排序字段名&sord=排序方式asc,desc
            Member.findAll({where:where, start:start, limit:limit, sidx:sidx, sord:sord, bt:bt, et:et}, function(err, rs) {
                if(err) { ep.unbind(); return next(err);}
                if (!rs || rs == undefined) return ep.trigger('error', {status:400, error:'查询结果为空！'});
                var jsonObj = {members:rs};
                ep.trigger('showList', jsonObj);
            });
        };
    }
};

exports.pageNew = function(req, res, next) {
    console.log("新建弹出框。。。");
    var pageState = 0;
    res.render('member/member',
        { layout: false, pageState:pageState});
};

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
        res.render('member/member', { layout: false, _id:_id, pageState:pageState});
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
        res.render('member/member', { layout: false, _id:_id, pageState:pageState});
    }catch(e){
        res.json({status:400, error:e.message}, 400);
    }
};

/**
 * 获取指定的会员数据
 * @param req
 * @param res
 * @param next
 */
exports.findMember = function(req, res, next) {
    var _id = req.params._id;
    var org_id = req.session.user.member.org_id;

    try {
        check(_id, "会员ID不能为空！").notNull();
        check(org_id, "商户ID不能为空！").notNull();

        Member.findOne({_id:_id, org_id:org_id}, function(err,member){
            if(err) return next(err);
            res.json({member:member}, 200);
        });
    }catch(e){
        res.json({status:400, error:e.message}, 400);
    }
}
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

/**
 *
 * @param req
 * @param res
 * @param next
 */
exports.findAllRoles = function(req,res,next){
    Role.findAll({},function(err, rs){
        if(err) return next(err);
        res.json({roles:rs}, 200);
    });
}


exports.saveMember = function(req,res,next){
    console.log("saveMember。。。");
    //开始校验输入数值的正确性
    var pet_name = req.body.pet_name;//
    var cellphone = req.body.cellphone;//
    var role_id = req.body.role_id;//
    var state = req.body.state;//
    var sex = sanitize(req.body.sex).ifNull(1);
    var birthday = sanitize(req.body.birthday).ifNull(getNow());
    var due_time = req.body.due_time;//
    var user_id = req.body.user_id;
    var privacy = sanitize(req.body.privacy).ifNull(0);
    var point = sanitize(req.body.point).ifNull(0);
    var savings = sanitize(req.body.savings).ifNull(0);
    var comment = sanitize(req.body.comment).ifNull("");

    var ep = EventProxy.create();

    //当有异常发生时触发
    ep.once('error', function(result) {
        ep.unbind();//remove all event
        return res.json(result.error, result.status);
    });

    ep.on('creatMember', function(member) {
        creatMember(member);
    });

    ep.on('addUserContent', function(member) {
        addUserContent(member);
    });

    //回调函数
    function feedback(result) {
        res.json(result, 201);
    };

    function creatMember(member){
        Member.create(member, function(err, info){
            if(err) return next(err);
            if(!info || !info.insertId) ep.trigger('error', {status:500, error:'创建会员出错。'});
            member._id = info.insertId;
            ep.trigger("addUserContent", member);
        });
    };

    function addUserContent(member){
        User.findOne({_id:member.user_id}, function(err, user){
            if(err) return next(err);
            if(!user) ep.trigger('error', {status:400, error:'未找到当前会员的User信息。'});

            member.user = user;
            feedback({member:member});
        });
    }


    try {
        check(pet_name, "保存失败，昵称不能为空！").notNull();
        check(cellphone, "保存失败，手机号码不能为空！").notNull();
        check(role_id, "保存失败，角色不能为空！").notNull();
        check(state, "保存失败，状态不能为空！").notNull();
        check(due_time, "保存失败，到期时间不能为空！").notNull();

        if(req.session.user.member.org_id){
            //判断是否需要新建user
            if(user_id){
                //不需要新建用户
                ep.trigger("creatMember", {"user_id":user_id, "org_id":req.session.user.member.org_id, "pet_name":pet_name, "privacy":privacy,
                    "point":point, "savings":savings, "comment":comment, "role_id":role_id, "state":state, "create_time":getNow(), "due_time":due_time});
            }else{
                //新建用户，创建默认密码并对密码进行加密
                var salt = bcrypt.genSaltSync(10);
                var pass = bcrypt.hashSync("123456", salt);
                User.create({"name":pet_name, "pet_name":pet_name, "cellphone":cellphone, "password":pass, "state":"1", "sex":sex, "birthday":birthday, "create_time":getNow()}, function(err, info){
                    if(err) return next(err);
                    ep.trigger("creatMember", {"user_id":info.insertId, "org_id":req.session.user.member.org_id, "pet_name":pet_name, "privacy":privacy,
                        "point":point, "savings":savings, "comment":comment, "role_id":role_id, "state":state, "create_time":getNow(), "due_time":due_time});
                });
            }
        }else{
            ep.trigger('error', {status:400, error:'获取当前用户所属商户失败。'});
        }
    }catch(e){
        res.json({status:400, error:e.message}, 400);
    }
};

exports.updateMember = function(req,res,next){
    console.log("开始进行更新。。。");
    //开始校验输入数值的正确性
    var _id = req.body._id;
    var pet_name = req.body.pet_name;
    var role_id = req.body.role_id;
    var state = req.body.state;
    var due_time = req.body.due_time;
    var user_id = req.body.user_id;
    var privacy = sanitize(req.body.privacy).ifNull(0);
    var point = sanitize(req.body.point).ifNull(0);
    var savings = sanitize(req.body.savings).ifNull(0);
    var comment = sanitize(req.body.comment).ifNull("");

    //console.log(">>>>>>>>>>>>>>>>>>>>>>>>"+JSON.stringify(req.body));
    //console.log(">>>>>>>>>>>>>>>>>>>>>>>>state:"+state+" || "+);

    try {
        check(_id, "更新失败，数据流水号为空！").notNull();
        check(pet_name, "更新失败，昵称不能为空！").notNull();
        check(role_id, "角色不能为空!").notNull().isInt();
        check(state, "状态不能为空!").notNull().isInt();
        check(due_time, "到期时间不能为空!").notNull().isDate();
        check(user_id, "会员ID不能为空!").notNull();

        //说明是更新数据
        Member.update({"_id":_id, "user_id":user_id, "pet_name":pet_name, "privacy":privacy,
            "point":point, "savings":savings, "comment":comment, "role_id":role_id, "state":state, "due_time":due_time}, function(err,info){
            if(err) return next(err);

            res.json({member:{_id:_id}}, 200);
        });
    }catch(e){
        res.json({status:400, error:e.message}, 400);
    }
};

exports.deleteMember = function(req,res,next){
    //开始校验输入数值的正确性
    console.log("开始进行删除。。。。");
    var _ids = req.params._ids;
    try {
        check(_ids, "删除失败，数据流水号为空！").notNull();
        Member.delete(_ids, function(err,ds){
            if(err) return next(err);
            return res.json({member:{_ids:_ids}}, 202);
        });
    }catch(e){
        res.json({status:400, error:e.message}, 400);
    }
};

/**
 * 通过手机号码判断是否允许创建员工信息
 * --当前只需要判断在member表中是否有此手机的会员已注册为本商户的会员。
 * --  如果member中无，则允许创建，否则不允许
 * 返回：
 *  200-成功；无user，无member，可创建user+member。
 *  202-已接受；有user，无商户关联member，可创建member。
 *  403-请求无效 ：说明请求参数有错，例如手机号码为空
 *  406-无法接受 :说明user和member中都有数据，->不允许创建。
 * @param req
 * @param res
 * @param next
 */
exports.memberRegJudge = function(req,res,next){
    console.log("memberRegJudge.....");
    var cellphone = req.params.cellphone;

    try {
        check(cellphone, "手机号码不能为空！").notNull();
        check(req.session.user.member.org_id, "获取当前用户所属商户失败！").notNull();
    }catch(e){
        return res.json({status:403, error:e.message}, 403);
    }

    //首先，判断会员表中是否包含此手机号码
    User.findOne({loginname:cellphone},function(err,user){
        if(err) return next(err);
        if(!user) return res.json({status:200, error:'此手机号码尚未注册为会员，允许注册！'}, 200);

        //如果user表中有相同号码的会员（user_id），则判断member表中是否包含此user_id
        Member.findOne({user_id:user._id, org_id:req.session.user.member.org_id}, function(err, member){
            if(err) return next(err);
            if(!member) return res.json({status:202, error:'此会员尚未创建本商户的会员信息，允许创建！', user:user}, 202);
            return res.json({status:406, error:'此手机号码已是本商户的会员！', member:member}, 406);
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

            if(!member) res.json({status:403, error:'获取用户的member失败！'});
            return res.json({status:200, member:member});
        });
    });
};