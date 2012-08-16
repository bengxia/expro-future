var aliyunOssUrl = "http://storage.aliyun.com/";

//页面初始化时调用，设置按钮显示，输入框是否只读等属性。
var pageInit = function(){

    merchantLevelInit();

    // - 新增(pageState=0)： _id 为空，isReadonly=false, 所有输入框为空，显示：保存按钮
    // - 查看(pageState=1)： _id不为空，isReadonly=true， 输入框有数据，显示：关闭按钮
    // - 编辑(pageState=2)： _id不为空，isReadonly=false， 输入框有数据，显示：保存按钮 + 关闭按钮
    var pageState = $("#pageState").val();
    if(0 == pageState){
        //新增
        $("#save").show();
        $("#update").hide();
        $("#create_time_div").hide();
    }else if(1 == pageState){
        //查看
        $(".allowInput").attr("readonly","readonly");

        $("#save").hide();//启动时隐藏保存按钮
        $("#update").hide();
        $("#logo_img_path_file_uploader").hide();
        $("#charter_img_path_file_uploader").hide();
        showContent();
    }else if(2 == pageState){
        //编辑
        $("#update").show();
        $("#save").hide();
        showContent();
    }

    if(1 != pageState){
        $("#due_time").datepicker({
            dateFormat: 'yy-mm-dd',
            changeMonth: true,
            changeYear: true,
            showOn: "button",
            buttonImage: "/images/calendar.gif",
            buttonImageOnly: true
        });
    }

};

var createUploader = function(){
//        var uploader = new qq.FileUploader({
//            element: document.getElementById('file-uploader-demo1'),
//            action: 'do-nothing.htm',
//            debug: true,
//            extraDropzones: [qq.getByClass(document, 'qq-upload-extra-drop-area')[0]]
//        });
    var logo_img_pathUploader = new qq.FileUploader({
        // pass the dom node (ex. $(selector)[0] for jQuery users)
        element: document.getElementById('logo_img_path_file_uploader'),
        allowedExtensions: ['jpg', 'jpeg', 'png', 'gif'],
        // path to server-side upload script
        action: '/upload',
        debug: true,
        onComplete: function(id, fileName, responseJSON){
            //console.log("responseJSON:"+responseJSON.fid);
            $("#logo_img_path_show").attr("src",aliyunOssUrl+responseJSON.fid);
            $("#logo_img_path").val(responseJSON.fid);
        }
    });

    var charter_img_pathUploader = new qq.FileUploader({
        // pass the dom node (ex. $(selector)[0] for jQuery users)
        element: document.getElementById('charter_img_path_file_uploader'),
        allowedExtensions: ['jpg', 'jpeg', 'png', 'gif'],
        // path to server-side upload script
        action: '/upload',
        debug: true,
        onComplete: function(id, fileName, responseJSON){
            //console.log("responseJSON:"+responseJSON.fid);
            $("#charter_img_path_show").attr("src",aliyunOssUrl+responseJSON.fid);
            $("#charter_img_path").val(responseJSON.fid);
        }
    });
}

var merchantLevelInit = function() {
    $.ajax({
        type: "Get",
        url: '/merchantLevels',
        dataType: "json",
        global: false,
        async: false,
        success: function (result) {
            console.log(JSON.stringify(result));
            if(result && result.merchantlevels && result.merchantlevels.length > 0){
                for(var i = 0; i < result.merchantlevels.length; i++) {
                    $("#merchant_level_id").append("<option value='"+result.merchantlevels[i]._id+"'>"+result.merchantlevels[i].name+"</option>");
                }
            }
        },
        error: function () {
            alert("Ajax请求数据失败!");
        }
    });
};

var showContent = function(){
    var _id = $("#_id").val();
    if(_id){
        $.ajax({
            type: "get",
            url: '/merchant/'+_id,
            dataType: "json",
            global: false,
            async: false,
            success: function (data, textStatus) {
                console.log("data:"+JSON.stringify(data));
                if(data && data.merchant){
                    var merchant = data.merchant;
                    $("#_id").val(merchant._id);
                    $("#short_name").val(merchant.short_name);
                    $("#full_name").val(merchant.full_name);
                    $("#state").val(merchant.state);
                    $("#type").val(merchant.type);
                    $("#logo_img_path").val(merchant.logo_img_path);
                    $("#logo_img_path_show").attr("src",aliyunOssUrl+merchant.logo_img_path);
                    $("#charter_num").val(merchant.charter_num);
                    $("#charter_img_path").val(merchant.charter_img_path);
                    $("#charter_img_path_show").attr("src",aliyunOssUrl+merchant.charter_img_path);
                    $("#create_time").val(merchant.create_time);
                    $("#due_time").val(merchant.due_time);
                    $("#address").val(merchant.address);
                    $("#website").val(merchant.website);
                    $("#phone").val(merchant.phone);
                    $("#fax").val(merchant.fax);
                    $("#self_intro").val(merchant.self_intro);
                    $("#member_intro").val(merchant.member_intro);
                    $("#district_code").val(merchant.district_code);
                    $("#merchant_level_id").val(merchant.merchant_level_id);
                    $("#comment").val(merchant.comment);
                }else{
                    $().message("获取数据失败,返回数据格式错误！");
                }
            },
            error: function () {
                $().message("获取信息失败！");
            }
        });
    }
};

$(function(){
    /*******************************************
     *              初始化页面显示
     *******************************************/
    pageInit();
    createUploader();

    /*******************************************
     *                    事件响应
     *******************************************/
    //提交表单进行保存
    $("#save").click(function(){
        var array = $(".allowInput").serializeArray();

        var serializeObj={};

        $(array).each(function(){
            if(serializeObj[this.name]){
                if($.isArray(serializeObj[this.name])){
                    serializeObj[this.name].push(this.value);
                }else{
                    serializeObj[this.name]=[serializeObj[this.name],this.value];
                }
            }else{
                serializeObj[this.name]=this.value;
            }
        });
        console.log("serializeObj:"+JSON.stringify(serializeObj));

        $.ajax({
            type: "post",
            url: '/merchant?_csrf='+$("#_csrf").val(),
            dataType: "json",
            global: false,
            async: false,
            data: serializeObj,
            success: function (data, textStatus) {
                $().message("添加成功！");
                $("#popDialog").dialog("close");
                $("#list").trigger("reloadGrid", [{current:true}]);
            },
            error: function (XMLHttpRequest, textStatus, errorThrown) {
                var res = JSON.parse(XMLHttpRequest.responseText);
                $().message(res.error);//有错
            }
        });
    });

    //提交表单进行保存
    $("#update").click(function(){
        var _id = $("#_id").val();
        if(!_id){
            return $().message("流水号不能为空！");
        }

        var array = $(".allowInput").serializeArray();

        var serializeObj={};

        $(array).each(function(){
            if(serializeObj[this.name]){
                if($.isArray(serializeObj[this.name])){
                    serializeObj[this.name].push(this.value);
                }else{
                    serializeObj[this.name]=[serializeObj[this.name],this.value];
                }
            }else{
                serializeObj[this.name]=this.value;
            }
        });
        serializeObj._id  = _id;


        console.log("serializeObj:"+JSON.stringify(serializeObj));

        $.ajax({
            type: "put",
            url: '/merchant?_csrf='+$("#_csrf").val(),
            dataType: "json",
            global: false,
            async: false,
            data: serializeObj,
            success: function (data, textStatus) {
                $().message("更新成功！");
                $("#popDialog").dialog("close");
                $("#list").trigger("reloadGrid", [{current:true}]);
            },
            error: function (XMLHttpRequest, textStatus, errorThrown) {
                var res = JSON.parse(XMLHttpRequest.responseText);
                $().message(res.error);//有错
            }
        });
    });


//    $('#add_form').ajaxForm({
//        beforeSubmit: validate,
//        success: function(msg){
//            if(201 == msg.status || 200 == msg.status){
//                $().message(msg.error);
//                $.fancybox.close();//为防止因为网络延时造成对话框不关闭，再次输入，提前关闭对话框。
//                $("#list").trigger("reloadGrid", [{current:true}]);
//            }else{
//                $().message("添加失败:"+msg.error);
//            }
//        }
//    });
//
//    //提交表单进行保存
//    $("#save").click(function(){
//        $('#add_form').submit();
//    });
//
//    function validate(formData, jqForm, options) {
//        var state = $("#state").attr("value");
//        var short_name = $("#short").attr("value");
//        var type = $("#type").attr("value");
//        var charter_num = $("#charter_num").attr("value");
//        var district_code = $("#district_code").attr("value");
//        var due_time = $("#due_time").attr("value");
//        var merchant_level_id = $("#merchant_level_id").attr("value");
//
//        if(!short_name || short_name.trim() == ""){
//            $().message("<b>请输入'商户简称'！</b>");
//            return false;
//        }else if(!state || state.trim() == ""){
//            $().message("<b>请选择'状态'！</b>");
//            return false;
//        }else if(!type || type.trim() == ""){
//            $().message("<b>请选择'类型'！</b>");
//            return false;
//        }else if(!charter_num || charter_num.trim() == ""){
//            $().message("<b>请输入'营业执照号'！</b>");
//            return false;
//        }else if(!district_code || district_code.trim() == ""){
//            $().message("<b>请输入'地区编号'！</b>");
//            return false;
//        }else if(!due_time || due_time.trim() == ""){
//            $().message("<b>请输入'到期时间'！</b>");
//            return false;
//        }else if(!merchant_level_id || merchant_level_id.trim() == ""){
//            $().message("<b>请输入'商户级别'！</b>");
//            return false;
//        }else{
//            $.fancybox.close();//为防止因为网络延时造成对话框不关闭，再次输入，提前关闭对话框。
//            $().message("正在提交...");
//        }
//    };
});




// in your app create uploader as soon as the DOM is ready
// don't wait for the window to load
//window.onload = createUploader;

