<<<<<<< HEAD
/*!
 * expro future - route.js
 * Copyright(c) 2012 gbo <gbo@extensivepro.com>
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
    
    //交易
    app.post('/deals', authToMember, deal.addDeal);//新增一条交易
    app.delete('/deals/:id', authToMember, deal.deleteDeal);//取消一条交易

    //交易管理
    //app.get('/deal/index', authToMember, deal.index);//交易列表
    app.get('/deals', authToMember, deal.index);//查询一批交易

    //交易明细
    app.get('/deals/:id', authToMember, dealItem.index);//查询指定交易的一批交易明细

    //仓库管理

    //Sync同步
    app.get('/sync/merchants/:id', sync.restrict, sync.merchant);//同步一个商户信息
    app.get('/sync/stores/:id', sync.restrict, sync.store);//同步一个门店信息
};
=======
/*! * nodeclub - route.js * Copyright(c) 2012 fengmk2 <fengmk2@gmail.com> * MIT Licensed *//** * Module dependencies. */var sign = require('./controllers/sign');var site = require('./controllers/site');var stores = require('./controllers/stores');var merchants = require('./controllers/merchants');var goods = require('./controllers/goods');var member = require('./controllers/member');var user = require('./controllers/user');var deal = require('./controllers/deal');var dealItem = require('./controllers/deal_item');/*var user = require('./controllers/user');var message = require('./controllers/message');var tag = require('./controllers/tag');var topic = require('./controllers/topic');var reply = require('./controllers/reply');var upload = require('./controllers/upload');var static = require('./controllers/static');var tools =require('./controllers/tools');*/var authToMember = function(req, res, next) {    if(req.session.user) next();    //else res.send(401);    else{        var refer = req.headers.referer || 'home';        req.session._loginReferer = refer;        res.render('sign/signin');    }};exports = module.exports = function(app) {    // home page    app.get('/', site.index);    // sign up, login, logout    app.get('/signin', sign.showLogin);    app.post('/signin', sign.login);    app.get('/signout', sign.signout);    //商户管理    app.get('/merchants/index', authToMember, merchants.index);//商户列表    app.get('/merchants/showCreatPage', authToMember, merchants.showCreatPage);//显示新增商户页面    app.post('/merchants/create', authToMember, merchants.create);//创建商户    app.get('/merchants/list', authToMember, merchants.getList);//获得商户列表List（非表格）-new    //门店管理    app.get('/stores/index', authToMember, stores.index);//门店列表    app.get('/stores/:_id?/:isEdit?', authToMember, stores.showStore);//显示已有门店（有_id）页面(查看 or 编辑:isEdit=true)    app.post('/stores', authToMember, stores.saveStore);//保存新增（无_id）    app.put('/stores/:_id?', authToMember, stores.updateStore);//更新（有_id）    app.delete('/stores/:_ids', authToMember, stores.deleteStore);//删除    //app.post('/stores/create', stores.create);//创建，更新门店    //app.get('/stores/delete', stores.delete);//删除门店    //商品类型管理    app.get('/goods/type', authToMember, goods.showTypes);//显示商品类型页面(弹出页面)    app.get('/goods/type/:_id', authToMember, goods.showTypeDetail);//显示商品类型详细（弹出页面右侧）    app.put('/goods/type/:_id', authToMember, goods.updateType);//更新选中的商品类型    app.post('/goods/type', authToMember, goods.creatType);//创建商品类型    app.delete('/goods/type/:_id', authToMember, goods.deleteType);//删除商品类型    //商品管理    app.get('/goods/index', authToMember, goods.index);//商品列表    app.get('/goods/:_id?/:isEdit?', authToMember, goods.showGoods);//显示已有商品（有_id）页面(查看 or 编辑:isEdit=true)    app.post('/goods', authToMember, goods.saveGoods);//保存新增商品（无_id）    app.put('/goods/:_id?', authToMember, goods.updateGoods);//更新已有商品（有_id）    app.delete('/goods/:_ids', authToMember, goods.deleteGoods);//删除商品    //员工管理    app.get('/member/index', authToMember, member.index);//员工列表    app.get('/member/:_id?/:isEdit?', authToMember, member.showMember);//显示已有员工（有_id）页面(查看 or 编辑:isEdit=true)    app.post('/member', authToMember, member.saveMember);//保存新增员工（无_id）    app.put('/member/:_id?', authToMember, member.updateMember);//更新已有员工（有_id）    app.delete('/member/:_ids', authToMember, member.deleteMember);//删除员工    app.get('/findMemberByUserid/:user_id', authToMember, member.findMemberByUserid);//通过会员ID获取员工信息    app.get('/memberRegJudge/:cellphone', authToMember, member.memberRegJudge);//通过手机号码判断是否允许创建员工信息    //User    app.get('/user/:cellphone', authToMember, user.getUserByCellphone);//根据手机号码查询用户    app.get('/user/:cellphone/:password', authToMember, user.checkUser);//根据手机号码查询用户    //交易管理    app.get('/deal/index', authToMember, deal.index);//交易列表    //app.get('/deal/:_id?/:isEdit?', deal.showMember);//显示已有员工（有_id）页面(查看 or 编辑:isEdit=true)    //app.post('/deal', deal.saveMember);//保存新增员工（无_id）    //app.put('/deal/:_id?', deal.updateMember);//更新已有员工（有_id）    //app.delete('/deal/:_ids', deal.deleteMember);//删除员工    //交易明细    app.get('/deal/items/:deal_id', authToMember, dealItem.index);//查询指定交易的一批交易明细/*  app.get('/signup', sign.signup);  app.post('/signup', sign.signup);  app.get('/signout', sign.signout);  app.get('/active_account', sign.active_account);  // password  app.get('/search_pass', sign.search_pass);  app.post('/search_pass', sign.search_pass);  app.get('/reset_pass', sign.reset_pass);  app.post('/reset_pass', sign.reset_pass);  // user  app.get('/user/:name', user.index);  app.get('/setting', user.setting);  app.post('/setting', user.setting);  app.get('/stars', user.show_stars);  app.get('/users/top100', user.top100);  app.get('/my/tags', user.get_collect_tags);  app.get('/my/topics', user.get_collect_topics);  app.get('/my/messages', message.index);  app.get('/my/follower', user.get_followers);  app.get('/my/following', user.get_followings);  app.get('/user/:name/topics', user.list_topics);  app.get('/user/:name/replies', user.list_replies);  app.post('/user/follow', user.follow);  app.post('/user/un_follow', user.un_follow);  app.post('/user/set_star', user.toggle_star);  app.post('/user/cancel_star', user.toggle_star);  // message  app.post('/messages/mark_read', message.mark_read);  app.post('/messages/mark_all_read', message.mark_all_read);  // tag  app.get('/tags/edit', tag.edit_tags);  app.get('/tag/:name', tag.list_topic);  app.get('/tag/:name/edit', tag.edit);  app.get('/tag/:name/delete', tag.delete);  app.post('/tag/add', tag.add);  app.post('/tag/:name/edit', tag.edit);  app.post('/tag/collect', tag.collect);  app.post('/tag/de_collect', tag.de_collect);  // topic  app.get('/topic/create', topic.create);  app.get('/topic/:tid', topic.index);  app.get('/topic/:tid/edit', topic.edit);  app.get('/topic/:tid/delete', topic.delete);  app.post('/topic/create', topic.create);  app.post('/topic/:tid/edit', topic.edit);  app.post('/topic/collect', topic.collect);  app.post('/topic/de_collect', topic.de_collect);  // reply  app.post('/:topic_id/reply', reply.add);  app.post('/:topic_id/reply2', reply.add_reply2);  app.post('/reply/:reply_id/delete', reply.delete);  // upload  app.post('/upload/image', upload.upload_image);    // tools  app.get('/site_tools', tools.run_site_tools);  // static  app.get('/about', static.about);  app.get('/faq', static.faq);*/};
>>>>>>> deal-start-doit
