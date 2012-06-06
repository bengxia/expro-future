/*!
 * nodeclub - route.js
 * Copyright(c) 2012 fengmk2 <fengmk2@gmail.com>
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
/*
var user = require('./controllers/user');
var message = require('./controllers/message');
var tag = require('./controllers/tag');
var topic = require('./controllers/topic');
var reply = require('./controllers/reply');
var upload = require('./controllers/upload');
var static = require('./controllers/static');
var tools =require('./controllers/tools');
*/

exports = module.exports = function(app) {
  // home page
  app.get('/', site.index);

  // sign up, login, logout
  app.get('/signin', sign.showLogin);
  app.post('/signin', sign.login);

  //门店管理
  app.get('/stores', stores.index);//门店列表
  app.get('/stores/showCreatPage', stores.showCreatPage);//显示新增门店页面
  app.get('/stores/showEditPage', stores.showEditPage);//显示修改门店页面
  app.post('/stores/create', stores.create);//创建，更新门店
  app.get('/stores/delete', stores.delete);//删除门店

  //商户管理
  app.get('/merchants', merchants.index);//商户列表
  app.get('/merchants/showCreatPage', merchants.showCreatPage);//显示新增商户页面
  app.post('/merchants/create', merchants.create);//创建商户

  //商品类型管理
  app.get('/goods/type', goods.showTypes);//显示商品类型页面(弹出页面)
  app.get('/goods/type/:_id', goods.showTypeDetail);//显示商品类型详细（弹出页面右侧）
  app.put('/goods/type/:_id', goods.updateType);//更新选中的商品类型
  //app.get('/goods/type', goods.showCreatType);//显示新增商品类型页
  app.post('/goods/type', goods.creatType);//创建商品类型
  app.delete('/goods/type/:_id', goods.deleteType);//删除商品类型

  //商品管理
  app.get('/goods/index', goods.index);//商品列表
  app.get('/goods/:_id?/:isEdit?', goods.showGoods);//显示已有商品（有_id）页面(查看 or 编辑:isEdit=true)
  app.post('/goods', goods.saveGoods);//保存新增商品（无_id）,或更新已有商品（有_id）
  app.put('/goods/:_id?', goods.updateGoods);//更新已有商品（有_id）
  app.delete('/goods/:_ids', goods.deleteGoods);//删除商品


/*  app.get('/signup', sign.signup);
  app.post('/signup', sign.signup);
  app.get('/signout', sign.signout);
  app.get('/active_account', sign.active_account);

  // password
  app.get('/search_pass', sign.search_pass);
  app.post('/search_pass', sign.search_pass);
  app.get('/reset_pass', sign.reset_pass);
  app.post('/reset_pass', sign.reset_pass);

  // user
  app.get('/user/:name', user.index);
  app.get('/setting', user.setting);
  app.post('/setting', user.setting);
  app.get('/stars', user.show_stars);
  app.get('/users/top100', user.top100);
  app.get('/my/tags', user.get_collect_tags);
  app.get('/my/topics', user.get_collect_topics);
  app.get('/my/messages', message.index);
  app.get('/my/follower', user.get_followers);
  app.get('/my/following', user.get_followings);
  app.get('/user/:name/topics', user.list_topics);
  app.get('/user/:name/replies', user.list_replies);
  app.post('/user/follow', user.follow);
  app.post('/user/un_follow', user.un_follow);
  app.post('/user/set_star', user.toggle_star);
  app.post('/user/cancel_star', user.toggle_star);

  // message
  app.post('/messages/mark_read', message.mark_read);
  app.post('/messages/mark_all_read', message.mark_all_read);

  // tag
  app.get('/tags/edit', tag.edit_tags);
  app.get('/tag/:name', tag.list_topic);
  app.get('/tag/:name/edit', tag.edit);
  app.get('/tag/:name/delete', tag.delete);
  app.post('/tag/add', tag.add);
  app.post('/tag/:name/edit', tag.edit);
  app.post('/tag/collect', tag.collect);
  app.post('/tag/de_collect', tag.de_collect);

  // topic
  app.get('/topic/create', topic.create);
  app.get('/topic/:tid', topic.index);
  app.get('/topic/:tid/edit', topic.edit);
  app.get('/topic/:tid/delete', topic.delete);
  app.post('/topic/create', topic.create);
  app.post('/topic/:tid/edit', topic.edit);
  app.post('/topic/collect', topic.collect);
  app.post('/topic/de_collect', topic.de_collect);

  // reply
  app.post('/:topic_id/reply', reply.add);
  app.post('/:topic_id/reply2', reply.add_reply2);
  app.post('/reply/:reply_id/delete', reply.delete);

  // upload
  app.post('/upload/image', upload.upload_image);
  
  // tools
  app.get('/site_tools', tools.run_site_tools);

  // static
  app.get('/about', static.about);
  app.get('/faq', static.faq);*/
};

