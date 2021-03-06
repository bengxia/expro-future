//设置前台页面显示的表格列头
var colNames = ['商户编号', '简称', '状态','类型','电话','注册时间','到期时间'];
//设置前台页面显示的表格数据
var colModel = [
    {name:'_id',index:'_id', width:100, align:"center",sortable:true},
    {name:'short_name',index:'short_name', width:100, align:"center",sortable:true,
        editable:true,
        edittype:'text',
        editoptions:{size:10,maxlength:15},
        editrules:{required:true},
        formoptions:{elmprefix:':(*)'}
    },
    {name:'state',index:'state', width:80,sortable:true,
        formatter:function(cellvalue, options, row){if(cellvalue==1){return "启用";}else{return "禁用";}},
        align:"center",
        editable:true,
        edittype:'checkbox',
        editoptions:{value:"1:0"},
        editrules:{required:true},
        formoptions:{elmprefix:'是否可用:(*)'}
    },
    {name:'type',index:'type', width:80, align:"center",sortable:true,
        formatter:function(cellvalue, options, row){if(cellvalue==0){return "连锁商户";}else if(cellvalue==1){return "小型商户";}else if(cellvalue==2){return "中型商户";}else if(cellvalue==3){return "大型商户";}},
        align:"center",
        editable:true,
        edittype:'text',
        editoptions:{size:10,maxlength:15},
        editrules:{required:true},
        formoptions:{elmprefix:':(*)'}
    },
    {name:'phone',index:'phone', width:90, align:"center",sortable:true,
        editable:true,
        edittype:'text',
        editoptions:{size:10,maxlength:15},
        editrules:{required:true},
        formoptions:{elmprefix:':(*)'}
    },
    {name:'create_time',index:'create_time', width:100, align:"center",sortable:true,
        editable:true,
        edittype:'text',
        editoptions:{size:10,maxlength:15},
        editrules:{required:true},
        formoptions:{elmprefix:':(*)'}
    },
    {name:'due_time',index:'due_time', width:100, align:"center",sortable:true,
        editable:true,
        edittype:'text',
        editoptions:{size:10,maxlength:15},
        editrules:{required:true},
        formoptions:{elmprefix:':(*)'}
    }
];

$(function(){
    jQuery("#list").jqGrid({
        url:'/merchants?isWeb=1',
        datatype: "json",
        mtype: 'GET',
        gridview:true, //加速显示
        multiselect: true,  //可多选，出现多选框
        multiselectWidth: 25, //设置多选列宽度
        colNames:colNames,
        colModel:colModel,
        rowNum:10,
        rowList:[10,20,30],
        pager: '#pager',
        sortname: 'create_time',
        sortorder:'desc',
        viewrecords: true,      
        caption:"商户列表",
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
        width: 800
    });

    $("#add_btn").click(function(){
        $("#popDialog").dialog({
            open: function(event, ui) {
                $(this).load('/merchant/new');
            },
            title: '添加新商户'
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
                        $(this).load('/merchant/view/'+sels);
                    },
                    title: '查看商户信息'
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
                        $(this).load('/merchant/edit/'+sels);
                    },
                    title: '修改商户信息'
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
                    url: "/merchant/"+sels,
                    data: "_csrf=#{csrf}",
                    beforeSend: function() {
                        $().message("正在请求...");
                    },
                    error:function(){
                        $().message("请求失败...");
                    },
                    success: function(data){
                        if(data.merchant._ids){
                            var arr = data.merchant._ids.split(',');
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
	$("#find_btn").click(function() {
		var obj = new Object();
		$(".query_input").each(function() {
			var key = $(this).attr('id');
			var value = $(this).val();
			obj[key] = value;
		});
		$("#list").jqGrid('setGridParam', {
			url: "/merchants/index",
			postData: obj,
			page: 1
		}).trigger("reloadGrid");
	}); 
});