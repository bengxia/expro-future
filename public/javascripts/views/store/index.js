
//设置前台页面显示的表格列头
var colNames = ['编号', '名称', '自定义编号','仓库编号','仓库名称','状态','创建时间'];
//设置前台页面显示的表格数据
var colModel = [
    {name:'_id',index:'_id', width:100, align:"center",sortable:true},
    {name:'name',index:'name', width:120, align:"center",sortable:true},
    {name:'inventar_num',index:'inventar_num', width:150, align:"center",sortable:true},
    {name:'warehouse_id',index:'warehouse_id', width:150, align:"center",sortable:true, hidden:true},
    {name:'warehouse_name',index:'warehouse_id', width:150, align:"center",sortable:false},
    {name:'state',index:'state', width:80, align:"center",sortable:true,formatter:'select', editoptions:{value:"0:封闭;1:正常;2:公开;3:不公开"}},
    {name:'create_time',index:'create_time', width:200, align:"center",sortable:true,
        formatter : 'date', formatoptions : {srcformat : 'Y-m-d H:i:s',newformat : 'Y-m-d H:i:s'}
    }];

$(function(){
    jQuery("#list").jqGrid({
        url:'/stores?isWeb=1',
        datatype: "json",
        mtype: 'GET',
        colNames:colNames,
        colModel:colModel,//由后台control中获得显示数据
        gridview:true, //加速显示
        multiselect: true,  //可多选，出现多选框
        multiselectWidth: 25, //设置多选列宽度
        rowNum:10,
        rowList:[10,20,30],
        pager: '#pager',
        sortname: 'create_time',
        sortorder:'desc',
        viewrecords: true,
        caption:"门店列表",
        autowidth: true, //自动匹配宽度
        height: 300,
        prmNames : {
            rows:"limit" // 表示请求行数的参数名称
        },
        loadComplete:function(data){ //完成服务器请求后，回调函数
            $("p.nodata").remove();
            $("#del_btn").removeAttr("disabled");
        },
        loadError:function(xhr,status,error){
            $("p").appendTo($("#list")).addClass("nodata").html('找不到相关数据！');
            $("#del_btn").attr("disabled",true);
        }
    });

    $("#popDialog").dialog({
        autoOpen: false,
        modal: true,
        height: 800,
        width: 600
    });

    $("#add_btn").click(function(){
        $("#popDialog").dialog({
            open: function(event, ui) {
                $(this).load('/store/new');
            },
            title: '添加新员工'
        });
        $("#popDialog").dialog("open");
        return false;
    });
    $("#view_btn").click(function(){
        var sels = $("#list").jqGrid('getGridParam','selarrrow');
        if(sels==""){
            $().message("请选择要查看的项！");
        }else{
            if(sels.toString().indexOf(',') > 0){
                $().message("只可选择一项进行查看！");
            }else{
                $("#popDialog").dialog({
                    open: function(event, ui) {
                        $(this).load('/store/view/'+sels);
                    },
                    title: '查看员工信息'
                });
                $("#popDialog").dialog("open");
                return false;
            }
        }
    });
    $("#edit_btn").click(function(){
        var sels = $("#list").jqGrid('getGridParam','selarrrow');
        if(sels==""){
            $().message("请选择要编辑的项！");
        }else{
            if(sels.toString().indexOf(',') > 0){
                $().message("只可选择一项进行编辑！");
            }else{
                $("#popDialog").dialog({
                    open: function(event, ui) {
                        $(this).load('/store/edit/'+sels);
                    },
                    title: '修改员工信息'
                });
                $("#popDialog").dialog("open");
                return false;
            }
        }
    });
    $("#del_btn").click(function(){
        var sels = $("#list").jqGrid('getGridParam','selarrrow');
        if(sels==""){
            $().message("请选择要删除的项！");
        }else{
            if(confirm("您是否确认删除？")){
                $.ajax({
                    type: "delete",
                    url: "/store/"+sels,
                    data: "_csrf=#{csrf}",
                    beforeSend: function() {
                        $().message("正在请求...");
                    },
                    error:function(){
                        $().message("请求失败...");
                    },
                    success: function(msg){
                        if(msg._ids){
                            var arr = msg._ids.split(',');
                            $.each(arr,function(i,n){
                                if(arr[i]!=""){
                                    $("#list").jqGrid('delRowData',n);
                                }
                            });
                            $().message("已成功删除!");
                        }else{
                            $().message("操作失败！");
                        }
                    }
                });
            }
        }
    });
    $("#find_btn").click(function(){
        var obj = {};//new Object();
        $(".query_input").each(function(){
            var key = $(this).attr('id');
            var value = $(this).val();
            obj[key] = value;
            /*
             if(value && value.trim() != "") {
             obj[key] = value;
             }else{
             delete obj[key];
             }*/
        });
        console.log(obj);

        $("#list").jqGrid('setGridParam',{
            url:"/stores/index",
            postData:obj,
            page:1
        }).trigger("reloadGrid");
    });
});