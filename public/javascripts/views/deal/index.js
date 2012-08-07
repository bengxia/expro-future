//设置前台页面显示的表格列头
var colNames = ['编号', '交易类型', '状态', '门店', '负责人','应付账款','现金支付','积分支付','支付类型','创建时间','消费会员'];
//设置前台页面显示的表格数据
var colModel = [
    {name:'_id',index:'_id', width:100, align:'center',sortable:true},
    {name:'type',index:'type', width:200, align:'center',sortable:true,formatter:'select',
        editoptions:{value:'0:消费撤销;1:消费;2:充值;3:充值撤销;4:积分增加;5:积分消费;6:积分撤销;7:退货退款;8:抽奖;9:手工调整'}},
    {name:'state',index:'state', width:200, align:'center',sortable:true,formatter:'select',
        editoptions:{value:'0:失败;1:成功'}},
    {name:'store_id',index:'store_id', width:200,align:'center',sortable:false},
    {name:'dealer_id',index:'dealer_id', width:200,align:'center',sortable:false},
    {name:'payment',index:'payment', width:200, align:'center',sortable:true},
    {name:'cash',index:'cash', width:200, align:'center',sortable:true},
    {name:'point',index:'point', width:200, align:'center',sortable:true},
    {name:'pay_type',index:'pay_type', width:200, align:'center',sortable:true,formatter:'select',
        editoptions:{value:'0:现金;1:银行卡;2:积分;3:现金+积分;4:银行卡+积分'}},
    {name:'create_time',index:'create_time', width:300, align:'center',sortable:true,
        formatter : 'date', formatoptions : {srcformat : 'Y-m-d H:i:s',newformat : 'Y-m-d H:i:s'}},
    {name:'customer_id',index:'customer_id', width:200,align:'center',sortable:false}];

//设置前台页面所要显示的数据字段,用于数据筛选
var showElement = getShowElement();
//同上
function getShowElement(){
    var ar = new Array();
    for(var i=0; i<colModel.length; i++){
        ar[i] = colModel[i].name;
    }
    return ar;
}

var jsonCondition = {};

function search() {
    jsonCondition = array2Json(jQuery("#frmSearchCustomer").serializeArray());
    jQuery("#list").trigger("reloadGrid");
}

function mergeObject(src, dest) {
    var i;
    for(i in src) {
        dest[i]=src[i];
    }
    return dest;
}

$(document).ready(function(){
    //start=起始行数&limit=每页显示行数&bt=交易发生时间起点&et=交易发生时间的截至时间&sidx=排序字段名&sord=排序方式asc,desc
    /*
    $.get("/deal/index",
        {start:0, limit:10, sidx:"create_time", sord:"desc"},
        function(data, textStatus){
            console.log("111data.status:"+data.status);
            if (200 == data.status) {
                for(var i=0;i<data.jsonObj.length;i++){
                    $("#list").jqGrid('addRowData',i+1,data.jsonObj[i]);
                }
                jQuery("#list").setGridParam({total:2, page:1, records:44}).trigger("reloadGrid");
            } else {
                console.log("/deal/index:"+textStatus);
            }
        },"json");

    $.get("/deal/count",
        {start:0, limit:10},
        function(data, textStatus){
            if (200 == data.status) {
                console.log("total:data.jsonObj.count:"+data.jsonObj.count);
                jQuery("#list").setGridParam({total:2, page:1, records:44, rows:100}).trigger("reloadGrid");
                //$("#list").jqGrid('setGridParam', {"page":"1","total":2,"records":44}).trigger("reloadGrid");
            } else {
                console.log(textStatus);
            }
        }, "json");
*/
});

//按钮事件Start
$(function(){
    jQuery("#list").jqGrid({
        url:'/deals?isWeb=1',
        datatype: "json",
        mtype: 'GET',
        colNames:colNames,
        colModel:colModel,
        gridview:true, //加速显示
        multiselect: true,  //可多选，出现多选框
        multiselectWidth: 25, //设置多选列宽度
        rowNum:10,
        rowList:[10,20,30],
        pager: '#pager',
        sortname: 'create_time',
        sortorder:'desc',
        viewrecords: true,
        caption:"员工列表",
        autowidth: true, //自动匹配宽度
        height: 300,
        prmNames : {
            rows:"limit" // 表示请求行数的参数名称
        },
        loadComplete:function(data){ //完成服务器请求后，回调函数
            console.log(data);
            if(data.records == undefined || data.records == 0){ //如果没有记录返回，追加提示信息，删除按钮不可用
                $("p").appendTo($("#list")).addClass("nodata").html('找不到相关数据！');
                $("#del_btn").attr("disabled",true);
            }else{ //否则，删除提示，删除按钮可用
                $("p.nodata").remove();
                $("#del_btn").removeAttr("disabled");
            }
        },
        loadError:function(xhr,status,error){
            $("p").appendTo($("#list")).addClass("nodata").html('查询数据出错！');
            $("#del_btn").attr("disabled",true);
        }
    });

    $("#view_btn").click(function(){
        var sels = $("#list").jqGrid('getGridParam','selarrrow');
        if(sels==""){
            $().message("请选择要查看的项！");
        }else{
            if(sels.toString().indexOf(',') > 0){
                $().message("只可选择一项进行查看！");
            }else{
                window.location.href='/deals/'+sels;
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
            url:"/deals",
            postData:obj,
            page:1
        }).trigger("reloadGrid");
    });
});