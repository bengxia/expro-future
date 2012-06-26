/*!
 * expro future - route.js
 * Copyright(c) 2012 gbo <gbo2@extensivepro.com>
 * MIT Licensed
 */

/**
 * Module dependencies.
 */
var sign = require('./controllers/sign');
var site = require('./controllers/site');
var stores = require('./controllers/stores');
var merchants = require('./controllers/merchants');
var goods = require('./controllers/goods');
var member = require('./controllers/member');
var user = require('./controllers/user');
var sync = require('./controllers/sync');

var authToMember = function(req, res, next) {
    if(req.session.user) next();
    else res.send(401);
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
    app.get('/merchants/showCreatPage', merchants.showCreatPage);//显示新增商户页面
    app.post('/merchants/create', merchants.create);//创建商户
    app.get('/merchants/list', merchants.getList);//获得商户列表List（非表格）-new

    //门店管理
    app.get('/stores/index', stores.index);//门店列表
    app.get('/stores/:_id?/:isEdit?', stores.showStore);//显示已有门店（有_id）页面(查看 or 编辑:isEdit=true)
    app.post('/stores', stores.saveStore);//保存新增（无_id）
    app.put('/stores/:_id?', stores.updateStore);//更新（有_id）
    app.delete('/stores/:_ids', stores.deleteStore);//删除
    //app.post('/stores/create', stores.create);//创建，更新门店
    //app.get('/stores/delete', stores.delete);//删除门店

    //商品类型管理
    app.get('/goods/type', goods.showTypes);//显示商品类型页面(弹出页面)
    app.get('/goods/type/:_id', goods.showTypeDetail);//显示商品类型详细（弹出页面右侧）
    app.put('/goods/type/:_id', goods.updateType);//更新选中的商品类型
    app.post('/goods/type', goods.creatType);//创建商品类型
    app.delete('/goods/type/:_id', goods.deleteType);//删除商品类型

    //商品管理
    app.get('/goods/index', goods.index);//商品列表
    app.get('/goods/:_id?/:isEdit?', goods.showGoods);//显示已有商品（有_id）页面(查看 or 编辑:isEdit=true)
    app.post('/goods', goods.saveGoods);//保存新增商品（无_id）
    app.put('/goods/:_id?', goods.updateGoods);//更新已有商品（有_id）
    app.delete('/goods/:_ids', goods.deleteGoods);//删除商品

    //员工管理
/** for review
    app.get('/members/:id', member.get);
    app.get('/members/add', member.addview);
    替代下面路由
*/
    app.get('/member/:_id?/:isEdit?', member.showMember);//显示已有员工（有_id）页面(查看 or 编辑:isEdit=true)
/** for review
    下面3个路由中member=>members，表示id的前后统一起来，用id。
    app.delete('/members', member.deleteList);
*/
    app.post('/member', member.saveMember);//保存新增员工（无_id）
    app.put('/member/:_id?', member.updateMember);//更新已有员工（有_id）
    app.delete('/member/:_ids', member.deleteMember);//删除员工
/** for review
    app.get('/members', member.index); //?user_id=1&cellphone=18912345678;
    替代下面3个路由
*/
    app.get('/member/index', member.index);//员工列表
    app.get('/findMemberByUserid/:user_id', member.findMemberByUserid);//通过会员ID获取员工信息
    app.get('/memberRegJudge/:cellphone', member.memberRegJudge);//通过手机号码判断是否允许创建员工信息

    //User
    app.get('/user/:cellphone', user.getUserByCellphone);//根据手机号码查询用户
    app.get('/user/:cellphone/:password', user.checkUser);//根据手机号码查询用户
    
    //Sync同步
    app.get('/sync/merchants/:id', sync.merchant);//同步商户信息
};
