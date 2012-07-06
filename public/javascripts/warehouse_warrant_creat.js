//设置前台页面显示的表格列头var colNames = ['编号', '名称', '商品类型','状态','资产编号','售价','创建时间','备注'];//设置前台页面显示的表格数据var colModel = [    {name:'_id',index:'_id', width:100, align:"center",sortable:true, hidden:true},    {name:'name',index:'name', width:200, align:"center",sortable:true},    {name:'type_id',index:'type_id', width:200, align:"center",sortable:true, hidden:true},    {name:'state',index:'state', width:150, align:"center",sortable:true,formatter:'select', editoptions:{value:"0:下架;1:上架"}, hidden:true},    {name:'code',index:'code', width:200,align:"center",sortable:true, hidden:true},    {name:'price',index:'price', width:200, align:"center",sortable:true},    {name:'create_time',index:'create_time', width:300, align:"center",sortable:true,        formatter : 'date', formatoptions : {srcformat : 'Y-m-d',newformat : 'Y-m-d'}, hidden:true    },    {name:'comment',index:'comment', width:200, align:"left",sortable:true, hidden:true}];/////////////////设置前台页面显示的表格列头var colNamesSel = ['编号', '名称', '商品类型','状态','资产编号','售价','创建时间','数量','单价','总价'];//设置前台页面显示的表格数据var colModelSel = [    {name:'_id',index:'_id', width:100, align:"center",sortable:true, hidden:true},    {name:'name',index:'name', width:200, align:"center",sortable:true,summaryType:'count'},    {name:'type_id',index:'type_id', width:200, align:"center",sortable:true, hidden:true},    {name:'state',index:'state', width:150, align:"center",sortable:true,formatter:'select', editoptions:{value:"0:下架;1:上架"}, hidden:true},    {name:'code',index:'code', width:200,align:"center",sortable:true, hidden:true},    {name:'price',index:'price', width:200, align:"center",sortable:true},    {name:'create_time',index:'create_time', width:300, align:"center",sortable:true,        formatter : 'date', formatoptions : {srcformat : 'Y-m-d',newformat : 'Y-m-d'}, hidden:true    },    {name:'num',index:'num', width:200, align:"center",editable:true},    {name:'unit_cost',index:'unit_cost', width:200, align:"center",editable:true},    {name:'total_cost',index:'total_cost', width:200, align:"center",editable:false}];$(document).ready(function(){    //页面初始化    initWarehouses();    initGoodsTypeTree();});$("#back_btn").click(function(){    window.location.href='/warehouse_warrant';});var summarySelectListFooter = function(){    var rows = $("#selectList").getRowData();    if(rows.length > 0){        var numSum = 0, priceSum = 0, unit_costSum = 0, total_costSum = 0;        for(var i = 0; i < rows.length; i++){            numSum += rows[i].num && !isNaN(rows[i].num)?parseFloat(rows[i].num):0;            priceSum += rows[i].price && !isNaN(rows[i].price)?parseFloat(rows[i].price):0;            unit_costSum += rows[i].unit_cost && !isNaN(rows[i].unit_cost)?parseFloat(rows[i].unit_cost):0;            total_costSum += rows[i].total_cost && !isNaN(rows[i].total_cost)?parseFloat(rows[i].total_cost):0;        }        jQuery('#selectList').jqGrid('footerData', 'set',            {_id:'', name:"汇总", type_id:"",state:"", code:"", price:priceSum.toFixed(2), create_time:"", num:numSum,                unit_cost:unit_costSum.toFixed(2), total_cost:total_costSum.toFixed(2)});    }}$(function(){    //选择商品类型对话框 Start    $.fx.speeds._default = 500;    $("#goodsTypeDialog").dialog({        autoOpen: false,        show: "blind",        hide: "explode"    });    $("#openGoodsTypeDialogBt").click(function(){        $("#goodsTypeDialog").dialog("open");        return false;    });    $( "#openGoodsTypeDialogBt" ).button();    $("#selAllTypeBt").click(function(){        var url = '/goods?isWeb=1';        $("#list").jqGrid('setGridParam', {url:url});        $("#list").trigger("reloadGrid");        return false;    });    $("#selAllTypeBt").button();    //选择商品类型对话框 End    //初始化tabs    $("#tabs").tabs({        event: "mouseover"    });    jQuery("#list").jqGrid({        url:'/goods?isWeb=1',        datatype: "json",        mtype: 'GET',        colNames:colNames,        colModel:colModel,        gridview:true, //加速显示        multiselect: false,  //可多选，出现多选框        rownumbers:true,        rowNum:10,        rowList:[10,20,30],        pager: '#pager',        sortname: 'create_time',        sortorder:'desc',        viewrecords: true,        caption:"待选商品列表",        autowidth: true, //自动匹配宽度        height: 300,        prmNames : {            rows:"limit" // 表示请求行数的参数名称        },        loadComplete:function(data){ //完成服务器请求后，回调函数            if(data.records == undefined || data.records == 0){ //如果没有记录返回，追加提示信息，删除按钮不可用                $("p").appendTo($("#list")).addClass("nodata").html('找不到相关数据！');                $("#del_btn").attr("disabled",true);            }else{ //否则，删除提示，删除按钮可用                $("p.nodata").remove();                $("#del_btn").removeAttr("disabled");            }        },        loadError:function(xhr,status,error){            $("p").appendTo($("#list")).addClass("nodata").html('查询数据出错！');            $("#del_btn").attr("disabled",true);        },        ondblClickRow:function(rowid,iRow,iCol,e){            var arrIds = jQuery("#selectList").jqGrid('getDataIDs');            if(arrIds.indexOf(rowid) < 0){                var data = $("#list").jqGrid('getRowData', rowid);                //初始化插入已选框的数据                data.unit_cost = data.price;                data.num = 1;                data.total_cost = data.price;                jQuery('#selectList').jqGrid('addRowData', rowid, data, 'last')            }        }    });    jQuery("#selectList").jqGrid({        url:'local',        colNames:colNamesSel,        colModel:colModelSel,        //gridview:true, //加速显示        rownumbers:true,        rowNum:10,        rowList:[10,20,30],        pager: '#selectPager',        sortname: 'create_time',        sortorder:'desc',        viewrecords: true,        emptyrecords:"请选择商品。",        caption:"已选商品列表",        autowidth: true, //自动匹配宽度        height:300,        forceFit:true,        cellEdit:true,        footerrow:true,        userDataOnFooter:true,        cellsubmit: 'clientArray',  //确定Cell Editing模式下，内容保存到远程服务器还是本地数组。'remote' 或者 'clientArray'。        afterInsertRow:function(rowid, aData){ //完成服务器请求后，回调函数            jQuery("#selectList").jqGrid('setCell', rowid, 'num', '', {color:'red'});            jQuery("#selectList").jqGrid('setCell', rowid, 'unit_cost', '', { color: 'red' });            jQuery("#selectList").jqGrid('setCell', rowid, 'total_cost', '', { color: 'red' });            summarySelectListFooter();        },        afterEditCell: function (rowid, cellname, value, iRow, iCol) {        },        afterSaveCell: function (rowid, cellname, value, iRow, iCol) {            var rowdata = jQuery("#selectList").jqGrid('getRowData',rowid);            jQuery("#selectList").jqGrid('setCell', rowid, 'total_cost', rowdata.num * rowdata.unit_cost);            summarySelectListFooter();        },        loadError:function(xhr,status,error){        },        ondblClickRow:function(rowid,iRow,iCol,e){            jQuery('#selectList').jqGrid('delRowData', rowid);            summarySelectListFooter();        }    });    //提交表单进行保存    $("#back_btn").click(function(){        window.location.href='/warehouse_warrant';    });    //提交表单进行保存    $("#save_btn").click(function(){        console.log("1111");        //alert('111');        //开始获取页面数据，组织json，准备post        //接收仓库ID        var recipient_id = $("#recipient_id").val();        var comment = $("#comment").val();        var supplier_id = $("#supplier_id").val();        var source_id = $("#source_id").val();        //获取已选项        var rows = $("#selectList").getRowData();        console.log("rows"+JSON.stringify(rows));        var submitRows = [];        var tempObj;        for(var i = 0; i < rows.length; i++){            tempObj = new Object();            tempObj.goods_id = rows[i]._id;            tempObj.num = rows[i].num;            tempObj.supplier_id = supplier_id;            tempObj.unit_cost = rows[i].unit_cost;            tempObj.total_cost = rows[i].total_cost;            submitRows[i] = tempObj;        }        console.log("submitRows"+JSON.stringify(submitRows));        var warehouse_warrant_json = {            warehouse_warrant:{                recipient_id:parseInt(recipient_id),                comment:comment,                source_id:parseInt(source_id),                warehouse_warrant_item:submitRows            }        };        console.log("warehouse_warrant_json:"+JSON.stringify(warehouse_warrant_json));        $.ajax({            type: "post",            url: '/warehouse_warrant?_csrf='+$("#_csrf").val(),            dataType: "json",            global: false,            async: false,            data: warehouse_warrant_json,            success: function (response) {                //console.log("ppp:"+JSON.stringify(response));                $().message("添加成功！");                window.location.href='/warehouse_warrant';            },            error: function (xhr, ajaxOptions, thrownError) {                //console.log("-----xhr:"+JSON.stringify(xhr));                //console.log("-----ajaxOptions:"+JSON.stringify(ajaxOptions));                //console.log("-----thrownError:"+JSON.stringify(thrownError));                $().message("添加失败:"+thrownError);            }        });    });    //提交表单参数设定    $('#add_form').ajaxForm({        beforeSubmit: validate,        success: function(result){            if(200 == result.status){                $().message("成功添加");                $("#list").trigger("reloadGrid", [{current:true}]);            }else{                $().message("添加失败:"+result.error);            }        }    });    //提交前校验    function validate(formData, jqForm, options) {        var pet_name = $("#pet_name").attr("value");        var due_time = $("#due_time").attr("value");        if(!pet_name || pet_name.trim() == ""){            $().message("<b>请输入'昵称'！</b>");            return false;        }else if(!due_time || due_time.trim() == ""){            $().message("<b>请输入'到期时间'！</b>");            return false;        }else{            $.fancybox.close();//为防止因为网络延时造成对话框不关闭，再次输入，提前关闭对话框。            $().message("正在提交...");        }    };});function initWarehouses(){    $.ajax({        type: "Get",        url: '/warehouse',        dataType: "json",        global: false,        async: false,        success: function (result) {            console.log(JSON.stringify(result));            if(result.length){                for(var i = 0; i < result.length; i++){                    $("#recipient_id").append("<option value='"+result[i]._id+"'>"+result[i].name+"</option>");                    $("#source_id").append("<option value='"+result[i]._id+"'>"+result[i].name+"</option>");                }            }        },        error: function () {            alert("Ajax请求数据失败!");        }    });};//页面初始化时调用，设置按钮显示，输入框是否只读等属性。function initGoodsTypeTree(){    var zTree;    var zNodes;//保存树节点的json对象    var setting = {        async: {            enable: true,            type:"get",            dataType:"text",            contentType:"application/json",            url:"/goods/type",            autoParam:["_id", "name"],            otherParam:{"otherParam":""},//可以传参，暂未使用            dataFilter: filter        },        view: {            dblClickExpand: false,            showLine: true,            selectedMulti: false,            expandSpeed: ($.browser.msie && parseInt($.browser.version)<=6)?"":"fast"        },        data: {            simpleData: {                enable:true,                idKey: "_id",                pIdKey: "parent_id",                rootPId: ""            }        },        callback: {            beforeClick: beforeClick,            onClick: onClick        }    };    function filter(treeId, parentNode, childNodes) {        if (!childNodes) return null;        for (var i=0, l=childNodes.length; i<l; i++) {            childNodes[i].name = childNodes[i].name.replace(/\.n/g, '.');        }        return childNodes;    };    function beforeClick(treeId, treeNode) {        //var check = (treeNode && !treeNode.isParent);        //if (!check) alert("只能选择叶子节点...");        //return check;        return true;    }    function onClick(e, treeId, treeNode) {        zTree = $.fn.zTree.getZTreeObj("treeDemo"),            nodes = zTree.getSelectedNodes(),            v = "";        _id = "";        //nodes.sort(function compare(a,b){return a.id-b.id;});        if(nodes.length){            v = nodes[0].name;            _id = nodes[0]._id;        }        var url = '/goods?isWeb=1&type_id='+_id;        $("#list").jqGrid('setGridParam', {url:url});        $("#list").trigger("reloadGrid");    }    $.ajax({        type: "Get",        url: '/goods/type',        dataType: "text",        global: false,        async: false,        success: function (strReult) {            zNodes=eval(strReult);        },        error: function () {            alert("Ajax请求数据失败!");        }    });    var t = $("#treeDemo");    t = $.fn.zTree.init(t, setting, zNodes);};