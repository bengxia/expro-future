/*! * expro future - route.js * Copyright(c) 2012 fengmk2 <gbo@extensivepro.com> * MIT Licensed */var sign = require('./controllers/sign');var site = require('./controllers/site');var stores = require('./controllers/stores');var merchants = require('./controllers/merchants');var goods = require('./controllers/goods');var member = require('./controllers/member');var staff = require('./controllers/staff');var user = require('./controllers/user');var deal = require('./controllers/deal');var dealItem = require('./controllers/deal_item');var sync = require('./controllers/sync');var warehouseWarrant = require('./controllers/warehouseWarrant');var warehouse = require('./controllers/warehouse');var merchantLevel = require('./controllers/merchantLevel');var fileupload = require('./controllers/fileupload');var authToMember = function(req, res, next) {    if(req.session.user) next();    //else res.send(401);    else{        var refer = req.headers.referer || 'home';        req.session._loginReferer = refer;        res.render('sign/signin');    }};/** * 判断当前用户权限 * @param req * @param res * @param next */var authToRole = function(req, res, next) {    var role = req.session.user.role;    if(role && role.route && role.route.length > 0){        for(var i = 0; i < role.route.length; i++){            var pathname = role.route[i].pathname;            //req('/status?:name').parse('/status?name=ryan', true);            console.log(pathname);        }        console.log("--------:"+req.headers["referer"]);        for (e in req.headers) {            console.log(e+": "+req.headers[e]);        }    }    if(role) next();    else{        res.json({error:"您没有权限访问此功能！"}, 403);    }};exports = module.exports = function(app) {    // home page    app.get('/', site.index);    // sign up, login, logout    app.get('/signin', sign.showLogin);    app.post('/signin', sign.login);    app.get('/signout', sign.signout);    app.post('/upload', authToMember, fileupload.upload);//商户文件上传    //商户管理    app.get('/merchants', authToMember, merchants.index);//商户列表    app.get('/merchant/new', authToMember, merchants.pageNew);//显示新建页面    app.get('/merchant/view/:_id', authToMember, merchants.pageView);//显示已有商户    app.get('/merchant/edit/:_id', authToMember, merchants.pageEdit);//编辑已有商户    app.get('/merchant/:_id', authToMember, merchants.findOne);//显示已有商户    app.post('/merchant', authToMember, merchants.saveMerchant);//创建商户    //app.get('/merchants/list', authToMember, merchants.getList);//获得商户列表List（非表格）-new    app.put('/merchant', authToMember, merchants.updateMerchant);//更新（有_id）    app.delete('/merchant/:_ids', authToMember, merchants.deleteMerchant);//删除    app.get('/merchantLevels', authToMember, merchantLevel.showMerchantLevel);//获得全部商户等级    //门店管理    app.get('/stores', authToMember, stores.index);//门店列表    app.get('/store/new', authToMember, stores.pageNew);//显示新建页面    app.get('/store/view/:_id', authToMember, stores.pageView);//显示已有商品    app.get('/store/edit/:_id', authToMember, stores.pageEdit);//编辑已有商品    app.get('/store/:_id', authToMember, stores.findOne);//显示已有商品    app.post('/store', authToMember, stores.saveStore);//保存新增（无_id）    app.put('/store', authToMember, stores.updateStore);//更新（有_id）    app.delete('/store/:_ids', authToMember, stores.deleteStore);//删除    //app.get('/stores/index', authToMember, stores.index);//门店列表    //app.get('/stores/:_id?/:isEdit?', authToMember, stores.showStore);//显示已有门店（有_id）页面(查看 or 编辑:isEdit=true)    //商品类型管理    app.get('/goods/type', authToMember, goods.showTypes);//显示商品类型页面(弹出页面)    app.get('/goods/type/:_id', authToMember, goods.showTypeDetail);//显示商品类型详细（弹出页面右侧）    app.put('/goods/type', authToMember, goods.updateType);//更新选中的商品类型    app.post('/goods/type', authToMember, goods.creatType);//创建商品类型    app.delete('/goods/type/:_id', authToMember, goods.deleteType);//删除商品类型    //商品管理    app.get('/goods', authToMember, goods.findAll);//商品列表    app.get('/goods/new', authToMember, goods.pageNew);//显示新建页面    app.get('/goods/view/:_id', authToMember, goods.pageView);//显示已有商品    app.get('/goods/edit/:_id', authToMember, goods.pageEdit);//编辑已有商品    app.get('/goods/:_id', authToMember, goods.findOne);//显示已有商品    app.post('/goods', authToMember, goods.saveGoods);//保存新增商品（无_id）    app.put('/goods', authToMember, goods.updateGoods);//更新已有商品（有_id）    app.delete('/goods/:_ids', authToMember, goods.deleteGoods);//删除商品    //角色    app.get('/roles', authToMember, member.findAllRoles);//角色列表    //员工管理    app.get('/staffs', authToMember, staff.findAll);//员工列表    app.get('/staff/new', authToMember, staff.pageNew);//显示新建页面    app.get('/staff/view/:_id', authToMember, staff.pageView);//显示已有    app.get('/staff/edit/:_id', authToMember, staff.pageEdit);//编辑已有    app.get('/staff/:_id', authToMember, staff.findStaff);//    app.post('/staff', authToMember, staff.saveStaff);//保存新增员工（无_id）    app.put('/staff', authToMember, staff.updateStaff);//更新已有员工（有_id）    app.delete('/staff/:_ids', authToMember, staff.deleteStaff);//删除员工    //会员管理    app.get('/members', authToMember, member.findAll);//员工列表    app.get('/member/new', authToMember, member.pageNew);//显示新建页面    app.get('/member/view/:_id', authToMember, member.pageView);//显示已有    app.get('/member/edit/:_id', authToMember, member.pageEdit);//编辑已有    app.get('/member/:_id', authToMember, member.findMember);//    //app.get('/member/:_id?/:isEdit?', authToMember, member.showMember);//显示已有员工（有_id）页面(查看 or 编辑:isEdit=true)    app.post('/member', authToMember, member.saveMember);//保存新增员工（无_id）    app.put('/member', authToMember, member.updateMember);//更新已有员工（有_id）    app.delete('/member/:_ids', authToMember, member.deleteMember);//删除员工    app.get('/findMemberByUserid/:user_id', authToMember, member.findMemberByUserid);//通过会员ID获取员工信息    app.get('/memberRegJudge/:cellphone', authToMember, member.memberRegJudge);//通过手机号码判断是否允许创建员工信息    //User    app.get('/user/:cellphone', authToMember, user.getUserByCellphone);//根据手机号码查询用户    app.get('/user/:cellphone/:password', authToMember, user.checkUser);//根据手机号码查询用户    //交易管理    app.get('/deals', authToMember, deal.index);//查询一批交易    app.get('/deal/count', authToMember, deal.count);//查询交易总数    app.get('/deal/:_id', authToMember, dealItem.index);//查询指定交易的明细    app.post('/deal', authToMember, deal.saveDeal);//新增一条交易    app.post('/deal/repeal', authToMember, deal.saverRepealDeal);//新增一条退款交易    app.delete('/deal/:_ids', authToMember, deal.deleteDeal);//取消一条交易    app.put('/deal', authToMember, deal.updateDeal);//更新一条交易    //仓单管理    app.get('/warehouse_warrants', authToMember, warehouseWarrant.index);//查询一批    app.get('/warehouse_warrant/new', authToMember, warehouseWarrant.showWarehouseWarrant);//显示新建页面    app.get('/warehouse_warrant/:id', authToMember, warehouseWarrant.findWarehouseWarrant);//查询一条    app.post('/warehouse_warrant', authToMember, warehouseWarrant.creatWarehouseWarrant);//新增一条    app.put('/warehouse_warrant', authToMember, warehouseWarrant.updateWarehouseWarrant);//更新一条交易    app.delete('/warehouse_warrant/:id', authToMember, warehouseWarrant.deleteWarehouseWarrant);//删除一条    //仓库管理    app.get('/warehouses', authToMember, warehouse.index);//查询一批仓库（门店仓库）    //Sync同步    app.get('/sync/merchants/:id', sync.restrict, sync.merchant);//同步一个商户信息    app.get('/sync/stores/:id', sync.restrict, sync.store);//同步一个门店信息};