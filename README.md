# Expro Future 泛盈商惠

基于nodejs的销售管理系统，基于Node club

## 介绍

Expro Future 是用 **Node.js** 和 **MySQL** 开发的销售管理平台。

## 安装部署

```bash
//clone expro future project
git clone git://github.com/extensivepro/expro-future.git  
cd expro-future
npm install ./
cp config.default.js config.js
// modify the config file as yours
node app.js
```
    
## 其它

小量修改了两个依赖模块：node-markdown，express
 
* node-markdown/lib/markdown.js  

allowedTags 添加：

```
embed  //支持 flash 视频
table|thead|tbody|tr|td|th|caption  //支持表格
```
   
allowedAttributes 添加：

```
embed:'src|quality|width|height|align|allowScriptAccess|allowFullScreen|mode|type'
table: 'class'
```

* express/node_modules/connect/lib/middleware/csrf.js 添加：

```javascript
if (req.body && req.body.user_action === 'upload_image') return next();
```

## 关于pull request

从现在开始，所有提交都要严格遵循[代码规范](https://github.com/windyrobin/iFrame/blob/master/style.md)。

## Authors

Below is the output from `git-summary`.

```

```
