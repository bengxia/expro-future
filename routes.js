/*!
 * expro future - route.js
 * Copyright(c) 2012 fengmk2 <gbo@extensivepro.com>
 * MIT Licensed
 */

var sign = require('./controllers/sign');
var site = require('./controllers/site');
var stores = require('./controllers/stores');
var merchants = require('./controllers/merchants');
var goods = require('./controllers/goods');
var member = require('./controllers/member');
var user = require('./controllers/user');
var deal = require('./controllers/deal');
var dealItem = require('./controllers/deal_item');
var sync = require('./controllers/sync');



var authToMember = function(req, res, next) {
    if(req.session.user) next();
    //else res.send(401);
    else{
        var refer = req.headers.referer || 'home';
        req.session._loginReferer = refer;
        res.render('sign/signin');
    }
};

exports = module.exports = function(app) {
    // home page
    app.get('/', site.index);

    // sign up, login, logout
    app.get('/signin', sign.showLogin);
    app.post('/signin', sign.login);
    app.get('/signout', sign.signout);

    //商户管理
    app.get('/merchants/index', authToMember, merchants.index);//商户列表
    app.get('/merchants/showCreatPage', authToMember, merchants.showCreatPage);//显示新增商户页面
    app.post('/merchants/create', authToMember, merchants.create);//创建商户
    app.get('/merchants/list', authToMember, merchants.getList);//获得商户列表List（非表格）-new

    //门店管理
    app.get('/stores/index', authToMember, stores.index);//门店列表
    app.get('/stores/:_id?/:isEdit?', authToMember, stores.showStore);//显示已有门店（有_id）页面(查看 or 编辑:isEdit=true)
    app.post('/stores', authToMember, stores.saveStore);//保存新增（无_id）
    app.put('/stores/:_id?', authToMember, stores.updateStore);//更新（有_id）
    app.delete('/stores/:_ids', authToMember, stores.deleteStore);//删除
    //app.post('/stores/create', stores.create);//创建，更新门店
    //app.get('/stores/delete', stores.delete);//删除门店

    //商品类型管理
    app.get('/goods/type', authToMember, goods.showTypes);//显示商品类型页面(弹出页面)
    app.get('/goods/type/:_id', authToMember, goods.showTypeDetail);//显示商品类型详细（弹出页面右侧）
    app.put('/goods/type/:_id', authToMember, goods.updateType);//更新选中的商品类型
    app.post('/goods/type', authToMember, goods.creatType);//创建商品类型
    app.delete('/goods/type/:_id', authToMember, goods.deleteType);//删除商品类型

    //商品管理
    app.get('/goods/index', authToMember, goods.index);//商品列表
    app.get('/goods/:_id?/:isEdit?', authToMember, goods.showGoods);//显示已有商品（有_id）页面(查看 or 编辑:isEdit=true)
    app.post('/goods', authToMember, goods.saveGoods);//保存新增商品（无_id）
    app.put('/goods/:_id?', authToMember, goods.updateGoods);//更新已有商品（有_id）
    app.delete('/goods/:_ids', authToMember, goods.deleteGoods);//删除商品

    //员工管理
    app.get('/member/index', authToMember, member.index);//员工列表
    app.get('/member/:_id?/:isEdit?', authToMember, member.showMember);//显示已有员工（有_id）页面(查看 or 编辑:isEdit=true)
    app.post('/member', authToMember, member.saveMember);//保存新增员工（无_id）
    app.put('/member/:_id?', authToMember, member.updateMember);//更新已有员工（有_id）
    app.delete('/member/:_ids', authToMember, member.deleteMember);//删除员工
    app.get('/findMemberByUserid/:user_id', authToMember, member.findMemberByUserid);//通过会员ID获取员工信息
    app.get('/memberRegJudge/:cellphone', authToMember, member.memberRegJudge);//通过手机号码判断是否允许创建员工信息

    //User
    app.get('/user/:cellphone', authToMember, user.getUserByCellphone);//根据手机号码查询用户
    app.get('/user/:cellphone/:password', authToMember, user.checkUser);//根据手机号码查询用户

    //交易管理
    //app.get('/deal/index', authToMember, deal.index);//交易列表
    app.get('/deals', authToMember, deal.index);//查询一批交易
    app.get('/deal/count', authToMember, deal.count);//查询交易总数

    //交易明细
    app.get('/deals/:id', authToMember, dealItem.index);//查询指定交易的一批交易明细
    //交易明细
    app.get('/deals/:id', authToMember, dealItem.index);//查询指定交易的一批交易明细

    //仓库管理

    //Sync同步
    app.get('/sync/merchants/:id', sync.restrict, sync.merchant);//同步一个商户信息
    app.get('/sync/stores/:id', sync.restrict, sync.store);//同步一个门店信息
};
