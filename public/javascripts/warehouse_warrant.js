//设置前台页面显示的表格列头var colNames = ['编号', '接收仓库', '接收仓库ID', '操作员', '操作员ID', '来源仓库', '来源仓库ID', '创建时间','备注'];//var showElement = ['_id', 'recipient_name', 'recipient_id', 'operator_name', 'operator_id', 'source_name', 'source_id', 'create_time', 'comment'];//设置前台页面显示的表格数据var colModel = [    {name:'_id',index:'_id', width:100, align:'center',sortable:true},    {name:'recipient_name',index:'recipient_name', width:200,align:'center',sortable:false},    {name:'recipient_id',index:'recipient_id', width:200,align:'center',sortable:true, hidden:true},    {name:'operator_name',index:'operator_name', width:200,align:'center',sortable:false},    {name:'operator_id',index:'operator_id', width:200,align:'center',sortable:true, hidden:true},    {name:'source_name',index:'source_name', width:200, align:'center',sortable:false},    {name:'source_id',index:'source_id', width:200, align:'center',sortable:true, hidden:true},    {name:'create_time',index:'create_time', width:300, align:'center',sortable:true,        formatter : 'date', formatoptions : {srcformat : 'Y-m-d H:i:s',newformat : 'Y-m-d H:i:s'}},    {name:'comment',index:'comment', width:200,align:'center',sortable:true}];//设置前台页面所要显示的数据字段,用于数据筛选var showElement = getShowElement();//同上function getShowElement(){    var ar = new Array();    for(var i=0; i<colModel.length; i++){        ar[i] = colModel[i].name;    }    return ar;}var jsonCondition = {};function search() {    jsonCondition = array2Json(jQuery("#frmSearchCustomer").serializeArray());    jQuery("#list").trigger("reloadGrid");}function mergeObject(src, dest) {    var i;    for(i in src) {        dest[i]=src[i];    }    return dest;}//按钮事件Start$(function(){    jQuery("#list").jqGrid({        url:'/warehouse_warrant?isWeb=1',        datatype: "json",        mtype: 'GET',        colNames:colNames,        colModel:colModel,        gridview:true, //加速显示        multiselect: true,  //可多选，出现多选框        multiselectWidth: 25, //设置多选列宽度        rowNum:10,        rowList:[10,20,30],        pager: '#pager',        sortname: 'create_time',        sortorder:'desc',        viewrecords: true,        caption:"进货单列表",        autowidth: true, //自动匹配宽度        height: 300,        prmNames : {            rows:"limit" // 表示请求行数的参数名称        },        loadComplete:function(data){ //完成服务器请求后，回调函数            console.log(data);            if(data.records == undefined || data.records == 0){ //如果没有记录返回，追加提示信息，删除按钮不可用                $("p").appendTo($("#list")).addClass("nodata").html('找不到相关数据！');                $("#del_btn").attr("disabled",true);            }else{ //否则，删除提示，删除按钮可用                $("p.nodata").remove();                $("#del_btn").removeAttr("disabled");            }        },        loadError:function(xhr,status,error){            $("p").appendTo($("#list")).addClass("nodata").html('查询数据出错！');            $("#del_btn").attr("disabled",true);        }    });    ////////////////////////////////////////////    ////          开始处理按钮事件            ////   ////////////////////////////////////////////    $("#add_btn").click(function(){        window.location.href='/warehouse_warrant/new';    });    $("#view_btn").click(function(){        var sels = $("#list").jqGrid('getGridParam','selarrrow');        if(sels==""){            $().message("请选择要查看的项！");        }else{            if(sels.toString().indexOf(',') > 0){                $().message("只可选择一项进行查看！");            }else{                window.location.href='/warehouse_warrant/'+sels;            }        }    });    $("#del_btn").click(function(){        var sels = $("#list").jqGrid('getGridParam','selarrrow');        if(sels==""){            $().message("请选择要删除的项！");        }else{            if(confirm("您是否确认删除？")){                $.ajax({                    type: "delete",                    url: "/warehouse_warrant/"+sels,                    data: "_csrf="+$("#_csrf").val(),                    beforeSend: function() {                        $().message("正在请求...");                    },                    error:function(){                        $().message("请求失败...");                    },                    success: function(msg){                        var arr = msg._ids.split(',');                        $.each(arr,function(i,n){                            if(arr[i]!=""){                                $("#list").jqGrid('delRowData',n);                            }                        });                        $().message("已成功删除!");                    }                });            }        }    });    $("#find_btn").click(function(){        var obj = {};//new Object();        $(".query_input").each(function(){            var key = $(this).attr('id');            var value = $(this).val();            obj[key] = value;            /*             if(value && value.trim() != "") {             obj[key] = value;             }else{             delete obj[key];             }*/        });        console.log(obj);        $("#list").jqGrid('setGridParam',{            url:"/warehouse_warrant",            postData:obj,            page:1        }).trigger("reloadGrid");    });});