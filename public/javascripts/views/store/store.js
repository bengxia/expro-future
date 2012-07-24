//页面初始化时调用，设置按钮显示，输入框是否只读等属性。var pageInit = function(){    // - 新增(pageState=0)： _id 为空，isReadonly=false, 所有输入框为空，显示：保存按钮    // - 查看(pageState=1)： _id不为空，isReadonly=true， 输入框有数据，显示：关闭按钮    // - 编辑(pageState=2)： _id不为空，isReadonly=false， 输入框有数据，显示：保存按钮 + 关闭按钮    var pageState = $("#pageState").val();    if(0 == pageState){        //新增        $("#save").show();        $("#update").hide();        $("#create_time_div").hide();    }else if(1 == pageState){        //查看        $(".allowInput").attr("readonly","readonly");        $("#save").hide();//启动时隐藏保存按钮        $("#update").hide();        showContent();    }else if(2 == pageState){        //编辑        $("#update").show();        $("#save").hide();        showContent();    }};var showContent = function(){    var _id = $("#store_id").val();    if(_id){        $.ajax({            type: "get",            url: '/store/'+_id,            dataType: "json",            global: false,            async: false,            success: function (data, textStatus) {                console.log("data:"+JSON.stringify(data));                if(data && data.store){                    var store = data.store;                    $("#store_name").val(store.name);                    $("#inventar_num").val(store.inventar_num);                    $("#state").val(store.state);                    $("#district_code").val(store.district_code);                    $("#address").val(store.address);                    $("#transit_info").val(store.transit_info);                    $("#warehouse_name").val(store.warehouse_name);                    $("#map_info").val(store.map_info);                    $("#notice").val(store.notice);                    $("#create_time").val(store.create_time);                    $("#comment").val(store.comment);                }else{                    $().message("获取数据失败,返回数据格式错误！");                }            },            error: function () {                $().message("获取信息失败！");            }        });    }};$(function(){    /*******************************************     *              初始化页面显示     *******************************************/    pageInit();    /*******************************************     *                    事件响应     *******************************************/    //提交表单进行保存    $("#save").click(function(){        var name = $("#store_name").val();        var inventar_num = $("#inventar_num").val();        var state = $("#state").val();        var district_code = $("#district_code").val();        var address = $("#address").val();        var transit_info = $("#transit_info").val();        var map_info = $("#map_info").val();        var notice = $("#notice").val();        var comment = $("#comment").val();        var store_json = {name:name, inventar_num:inventar_num, state:state, district_code:district_code, address:address,            transit_info:transit_info, map_info:map_info, notice:notice, comment:comment};        console.log("store_json:"+JSON.stringify(store_json));        $.ajax({            type: "post",            url: '/store?_csrf='+$("#_csrf").val(),            dataType: "json",            global: false,            async: false,            data: store_json,            success: function (data, textStatus) {                $().message("添加成功！");                $("#popDialog").dialog("close");                $("#list").trigger("reloadGrid", [{current:true}]);            },            error: function (XMLHttpRequest, textStatus, errorThrown) {                var res = JSON.parse(XMLHttpRequest.responseText);                $().message(res.error);//有错            }        });    });    //提交表单进行保存    $("#update").click(function(){        var _id = $("#_id").val();        var name = $("#store_name").val();        var inventar_num = $("#inventar_num").val();        var state = $("#state").val();        var district_code = $("#district_code").val();        var address = $("#address").val();        var transit_info = $("#transit_info").val();        var map_info = $("#map_info").val();        var notice = $("#notice").val();        var comment = $("#comment").val();        var store_json = {_id:_id, name:name, inventar_num:inventar_num, state:state, district_code:district_code, address:address,            transit_info:transit_info, map_info:map_info, notice:notice, comment:comment};        console.log("store_json:"+JSON.stringify(store_json));        $.ajax({            type: "put",            url: '/store?_csrf='+$("#_csrf").val(),            dataType: "json",            global: false,            async: false,            data: store_json,            success: function (data, textStatus) {                $().message("添加成功！");                $("#popDialog").dialog("close");                $("#list").trigger("reloadGrid", [{current:true}]);            },            error: function (XMLHttpRequest, textStatus, errorThrown) {                var res = JSON.parse(XMLHttpRequest.responseText);                $().message(res.error);//有错            }        });    });});