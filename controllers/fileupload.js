var fs = require('fs'),
    util = require('util'),
    uuid = require('node-uuid');

var ossApi = require('../libs/oss_client');

var Log = require('../log.js');
var log = Log.create(Log.INFO, {'file':'public/node.debug'});

var oss = new ossApi.OssClient();
var myBucketName = "expro_test_01";

//oss.createBucket(myBucketName, 'private', function (err) {
//    console.log(err);
//});

oss.listBucket(function (err, list) {
    log.info("listBucket.....");
    var jsonStr = JSON.stringify(list);
    log.info(jsonStr);
    //console.log(list['Buckets']['Bucket'][0]);
});

var uploadpath = __dirname + '/../userfiles/uploads/';
var temppath = __dirname + '/../userfiles/tmp/';

exports.upload = function(req,res,next){
    log.info("开始上传文件了``````");
    console.log("uploadpath path:"+uploadpath);

//    var fSize = req.header('x-file-size');
//    var fType = req.header('x-file-type');
//    log.info("fType:"+fType);
//    log.info("fSize:"+fSize);

    var callback = function(data){
        log.info("开始返回结果....");
        if(data.success)
            return res.send(JSON.stringify(data), {'Content-Type': 'text/plain'}, 200);
        else
            return res.send(JSON.stringify(data), {'Content-Type': 'text/plain'}, 404);
    };
    var getFileExtName = function(fileName){
        //获取欲上传的文件路径
//        var fileName = name.value;
        //为了避免转义反斜杠出问题，这里将对其进行转换
        var re = /(\\+)/g;
        var filename = fileName.replace(re,"#");
        //对路径字符串进行剪切截取
        var one=filename.split("#");
        //获取数组中最后一个，即文件名
        var two=one[one.length-1];
        //再对文件名进行截取，以取得后缀名
        var three=two.split(".");
        //获取截取的最后一个字符串，即为后缀名
        var last=three[three.length-1];
        return last;
    };

    if(req.xhr) {
        var fname = req.header('x-file-name');
        fname = decodeURIComponent(fname);
        log.info("fname:"+fname);


        var tmpfile = temppath + uuid.v1();
        console.log("tmpfile path:"+tmpfile);

        // Open a temporary writestream
        var ws = fs.createWriteStream(tmpfile);

        ws.on('error', function(err) {
            callback({success: false, error: "Sorry, could not open writestream."});
        });

        ws.on('close', function(err) {
            if(err) callback({success: false, error: err});
//            log.info("close ...");
//            //update to OSS
//            log.info("开始上传OSS...");
//            log.info("myBucketName:"+myBucketName);
//            log.info("object名:"+fname);
//            log.info("srcFile-上传的源文件路径:"+tmpfile);
//            var objGroup = uuid.v1();
//            var dataArray = new Array();
//            dataArray = [tmpfile];
//            oss.createObjectGroup(myBucketName, objGroup, null, function(err) {
//                if(err) callback({success: false, error: err});
//                callback({success: true, error:'good!!'});
//            });
            var fileext = getFileExtName(fname);
            log.info("fileext:"+fileext);
            fname = uuid.v1()+"."+fileext;
            var returnFid = myBucketName + "/" + fname;
            oss.putObject(myBucketName, fname, tmpfile, function(err){
                if(err) callback({success: false, error: err});
                //callback({success: true, error:fname});
            });

            //oss.getObject()
            callback({success: true, fid:returnFid});
        });

        // Writing filedata into writestream
        req.on('data', function(data) {
            ws.write(data);
        });

        req.on('end', function() {
            ws.end();
        });
    }
    /*
    uploadFile(req, uploadpath, function(data) {
        if(data.success)
            res.send(JSON.stringify(data), {'Content-Type': 'text/plain'}, 200);
        else
            res.send(JSON.stringify(data), {'Content-Type': 'text/plain'}, 404);
    });*/
};

// Mainfunction to recieve and process the file upload data asynchronously
var uploadFile = function(req, targetdir, callback) {

    // Moves the uploaded file from temp directory to it's destination
    // and calls the callback with the JSON-data that could be returned.
    var moveToDestination = function(sourcefile, targetfile) {
        moveFile(sourcefile, targetfile, function(err) {
            if(!err)
                callback({success: true});
            else
                callback({success: false, error: err});
        });
    };

    // Direct async xhr stream data upload, yeah baby.
    if(req.xhr) {
//        log.info("req.files.qqfile.path:"+req.files);
//        log.info("req.files.qqfile.name:"+req.files.qqfile.name);
        fname = req.header('x-file-name');

        // Be sure you can write to '/tmp/'
        var tmpfile = temppath + uuid.v1();
        console.log("tmpfile path:"+tmpfile);
        // Open a temporary writestream
        var ws = fs.createWriteStream(tmpfile);
        ws.on('error', function(err) {
            console.log("uploadFile() - req.xhr - could not open writestream.");
            callback({success: false, error: "Sorry, could not open writestream."});
        });
        ws.on('close', function(err) {
            moveToDestination(tmpfile, targetdir+fname);
        });

        // Writing filedata into writestream
        req.on('data', function(data) {
            ws.write(data);
        });
        req.on('end', function() {
            ws.end();
        });
    }
    // Old form-based upload
    else {
        moveToDestination(req.files.qqfile.path, targetdir+req.files.qqfile.name);
    }
};

// Moves a file asynchronously over partition borders
var moveFile = function(source, dest, callback) {
    var is = fs.createReadStream(source);

    is.on('error', function(err) {
        console.log('moveFile() - Could not open readstream.');
        callback('Sorry, could not open readstream.')
    });

    is.on('open', function() {
        console.log("dest:"+dest);
        var os = fs.createWriteStream(dest);

        os.on('error', function(err) {
            console.log('moveFile() - Could not open writestream.');
            callback('Sorry, could not open writestream.');
        });

        os.on('open', function() {
            util.pump(is, os, function() {
                fs.unlinkSync(source);
            });

            callback();
        });
    });
};