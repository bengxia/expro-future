//页面初始化时调用，设置按钮显示，输入框是否只读等属性。
var pageInit = function(){
    // - 新增(pageState=0)： _id 为空，isReadonly=false, 所有输入框为空，显示：保存按钮
    // - 查看(pageState=1)： _id不为空，isReadonly=true， 输入框有数据，显示：关闭按钮
    // - 编辑(pageState=2)： _id不为空，isReadonly=false， 输入框有数据，显示：保存按钮 + 关闭按钮
    var pageState = $("#pageState").val();
    $("#save").hide();
    $("#update").hide();

    initRole();
    initStore();

    if(0 == pageState){
        //打开新增对话框 step-1
        showCellphoneContent();
        //初始化日期控件
        initDatepicker();

    }else if(1 == pageState){
        //查看状态
        showMemberContent();
        //$("#passwordContent").show();
    }else if(2 == pageState){
        //编辑状态
        showMemberContent();
        //初始化日期控件
        initDatepicker();
        $("#update").slideDown("fast");
        //设置控件可编辑状态
        $("#point").attr("readonly", true);
        $("#savings").attr("readonly", true);
    }else{
        showCellphoneContent();
    }
};

var initDatepicker = function(){
    $("#due_time").datepicker({
        dateFormat: 'yy-mm-dd',
        changeMonth: true,
        changeYear: true,
        showOn: "button",
        buttonImage: "/images/calendar.gif",
        buttonImageOnly: true
    });

    $("#birthday").datepicker({
        dateFormat: 'yy-mm-dd',
        changeMonth: true,
        changeYear: true,
        showOn: "button",
        buttonImage: "/images/calendar.gif",
        buttonImageOnly: true
    });
};

var showCellphoneContent = function(){
    $("#cellphoneContent").show();
    $("#passwordContent").hide();//启动时隐藏密码输入区域
    $("#memberContent").hide();//启动时隐藏员工信息
    $("#userContent").hide();//启动时隐藏会员信息
};

var showMemberContent = function(){
    $("#cellphoneContent").hide();
    $("#passwordContent").hide();
    $("#memberContent").show();
    $("#userContent").hide();
    //判断当前页面是否包含member的_id，如果有，则获取数据
    var member_id = $("#member_id").val();
    if(member_id){
        $.ajax({
            type: "Get",
            url: '/staff/'+member_id,
            dataType: "json",
            global: false,
            async: false,
            success: function (data, textStatus) {
                console.log("data:"+JSON.stringify(data));
                if(data && data.member){
                    var member = data.member;
                    $("#user_id").val(member.user_id);
                    $("#pet_name").val(member.pet_name);
                    $("#store_id").val(member.store_id);
                    $("#role_id").val(member.role_id);
                    $("#state").val(member.state);
                    $("#privacy").val(member.privacy);
                    $("#point").val(member.point);
                    $("#savings").val(member.savings);
                    $("#create_time").val(member.create_time);
                    $("#due_time").val(member.due_time);
                    $("#comment").val(member.comment);
                }else{
                    $().message("获取会员信息失败,返回数据格式错误！");
                }
            },
            error: function () {
                $().message("获取会员信息失败！");
            }
        });
    }
};

var initStore = function(){
    $.ajax({
        type: "Get",
        url: '/stores',
        dataType: "json",
        global: false,
        async: false,
        success: function (data, textStatus) {
            if(data && data.stores){
//                console.log('data.stores:'+JSON.stringify(data.stores));
//                console.log("data.stores.length:"+data.stores.length);
                for(var i = 0; i < data.stores.length; i++){
                    $("#store_id").append("<option value='"+data.stores[i]._id+"'>"+data.stores[i].name+"</option>");
                }
            }else{
                $().message("获取门店信息失败,返回数据格式错误！");
            }
        },
        error: function () {
            $().message("获取门店信息失败！");
        }
    });
};
var initRole = function(){
    $.ajax({
        type: "Get",
        url: '/roles',
        dataType: "json",
        global: false,
        async: false,
        success: function (data, textStatus) {
            if(data && data.roles){
                var roles = data.roles;
                for(var i = 0; i < roles.length; i++){
                    if(roles[i]._id && roles[i]._id <= 10){
                        $("#role_id").append("<option value='"+roles[i]._id+"'>"+roles[i].name+"</option>");
                    }
                }
            }else{
                $().message("获取角色信息失败,返回数据格式错误！");
            }
        },
        error: function () {
            $().message("获取角色信息失败！");
        }
    });
};

//var showPasswordContent = function(){
//    $("#cellphoneContent").hide();
//    $("#passwordContent").show();
//    $("#memberContent").hide();
//    $("#userContent").hide();
//};
//
//
//
//var showUserContent = function(){
//    $("#cellphoneContent").hide();
//    $("#passwordContent").hide();
//    $("#memberContent").hide();
//    $("#userContent").show();
//};


$(function(){
    /*******************************************
     *              初始化页面显示
     *******************************************/
    pageInit();

    /*******************************************
     *                    事件响应
     *******************************************/
    //提交前校验
    function validate(formData, jqForm, options) {
        var pet_name = $("#pet_name").attr("value");
        var due_time = $("#due_time").attr("value");

        if(!pet_name || pet_name.trim() == ""){
            $().message("<b>请输入'昵称'！</b>");
            return false;
        }else if(!due_time || due_time.trim() == ""){
            $().message("<b>请输入'到期时间'！</b>");
            return false;
        }else{
            $.fancybox.close();//为防止因为网络延时造成对话框不关闭，再次输入，提前关闭对话框。
            $().message("正在提交...");
        }
    };

    //提交表单进行保存
    $("#save").click(function(){
        var user_id = $("#user_id").val();
        //-----
        var cellphone = $("#cellphone").val();
        var pet_name = $("#pet_name").val();
        var store_id = $("#store_id").val();
        var role_id = $("#role_id").val();
        var state = $("#state").val();
        var privacy = $("#privacy").val();
        var point = $("#point").val();
        var savings = $("#savings").val();
        var due_time = $("#due_time").val();
        var comment =  $("#comment").val();

        var member_json = {cellphone:cellphone, pet_name:pet_name, role_id:role_id, store_id:store_id, state:state, privacy:privacy, point:point,
            savings:savings, due_time:due_time, comment:comment};

        if(!user_id){
            member_json.sex = $("#sex").val();
            member_json.birthday = $("#birthday").val();
        }else{
            member_json.user_id = user_id;
        }

        //console.log("member_json:"+JSON.stringify(member_json));

        $.ajax({
            type: "post",
            url: '/staff?_csrf='+$("#_csrf").val(),
            dataType: "json",
            global: false,
            async: false,
            data: member_json,
            success: function (data, textStatus) {
                console.log("data:"+JSON.stringify(data));
                $().message("添加成功！");
                $("#popDialog").dialog("close");
                $("#list").trigger("reloadGrid", [{current:true}]);
            },
            error: function (XMLHttpRequest, textStatus, errorThrown) {
                console.log("XMLHttpRequest:"+JSON.stringify(XMLHttpRequest));
                var res = JSON.parse(XMLHttpRequest.responseText);
                $().message(res.error);//有错
            }
        });

    });

    $("#update").click(function(){
        var _id = $("#_id").val();
        var user_id = $("#user_id").val();
        var pet_name = $("#pet_name").val();
        var store_id = $("#store_id").val();
        var role_id = $("#role_id").val();
        var state = $("#state").val();
        var privacy = $("#privacy").val();
        var point = $("#point").val();
        var savings = $("#savings").val();
        var due_time = $("#due_time").val();
        var comment =  $("#comment").val();

        var member_update_json = {_id:_id, pet_name:pet_name, user_id:user_id, store_id:store_id, role_id:role_id, state:state, privacy:privacy, point:point,
            savings:savings, due_time:due_time, comment:comment};

        //console.log("member_update_json:"+JSON.stringify(member_update_json));

        $.ajax({
            type: "put",
            url: '/staff?_csrf='+$("#_csrf").val(),
            dataType: "json",
            global: false,
            async: false,
            data: member_update_json,
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

    //输入手机号码后的“下一步”,显示  1）密码输入； 2）员工信息输入
    $("#cellphoneNextBt").click(function(){
        var cellphone = $('#cellphoneFirst').attr("value");
        if(!cellphone || cellphone.trim() == ""){
            return $().message("请您输入手机号码");
        }
        $("#cellphone").val(cellphone);
        $.ajax({
            type: "Get",
            url: '/memberRegJudge/'+cellphone,
            dataType: "json",
            global: false,
            async: false,
            /*
             *  200-成功；无user，无member，可创建user+member。
             *  202-已接受；有user，无商户关联member，可创建member。
             *  403-请求无效 ：说明请求参数有错，例如手机号码为空
             *  406-无法接受 :说明user和member中都有数据，->不允许创建。
             */
            success: function (data, textStatus) {
                $().message(data.error);
                if(200 == data.status){
                    $("#cellphoneContent").hide();
                    $("#passwordContent").hide();
                    $("#memberContent").slideDown("fast");
                    $("#userContent").slideDown("fast");
                    //显示保存按钮
                    $("#save").slideDown("fast");
                }else if(202 == data.status){
                    $("#user_id").val(data.user._id);
                    $("#cellphoneContent").hide();
                    $("#passwordContent").hide();
                    $("#memberContent").slideDown("fast");
                    $("#userContent").hide();
                    //显示保存按钮
                    $("#save").slideDown("fast");
                }
            },
            error: function (XMLHttpRequest, textStatus, errorThrown) {
                var res = JSON.parse(XMLHttpRequest.responseText);
                $().message(res.error);//有错
            }
        });
    });

//对输入的密码进行验证
    $("#checkPasswordBt").click(function(){
        var cellphone = $('#cellphone').attr("value");
        var pass = $('#passwordCK').attr("value");
        if(!cellphone || cellphone.trim() == ""){
            return $().message("请您输入手机号码！");
        }
        if(!pass || pass.trim() == ""){
            return $().message("请您输入密码！");
        }
        //对用户密码进行验证，如果验证通过，则允许其查看会员信息，并保存员工信息。
        checkUser(cellphone, pass);

    });

    //对用户密码进行验证
    function checkUser(cellphone, pass){
        $.ajax({
            type: "Get",
            url: '/user/'+cellphone+'/'+pass,
            dataType: "json",
            global: false,
            async: false,
            success: function (res) {
                if(200 == res.status) {
                    $().message("恭喜，你输入的密码已通过验证！");
                    alert(res.user._id);
                    //隐藏密码输入框
                    $("#passwordContent").fadeOut("slow");
                    //显示员工信息
                    $("#userContent").slideDown("slow");

                    $("#name").val(res.user.name);
                    $("#user_id").val(res.user._id);
                    $("#userState").val(res.user.state);
                    $("#userSex").val(res.user.sex);
                    $("#user_pet_name").val(res.user.pet_name);
                    $("#birthday").val(res.user.birthday);
                    $("#idcard").val(res.user.idcard);
                    $("#email").val(res.user.email);
                    $("#user_create_time").html(res.user.create_time);
                    $("#userComment").val(res.user.comment);

                    //将会员信息显示块与员工信息显示块进行对调
                    //var memberContent = $("#memberContent").clone();
                    //$("#memberContent").remove();
                    //$("#userContent").after(memberContent);

                    //显示保存按钮
                    $("#save").slideDown("fast");
                    $("#birthday").datepicker({disabled: true});//日期控件不可选
                }
                else
                    $().message(res.error);
            },
            error: function () {
                alert("Ajax请求数据失败!");
            }
        });
    };
});




//function hideMenu() {
//    $("#passwordContent").fadeOut("slow");
//};



