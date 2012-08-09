$(function(){
    jQuery("#list").jqGrid({
        url:'/merchants?isWeb=1',
        datatype: "json",
        mtype: 'GET',
        gridview:true, //加速显示
        multiselect: true,  //可多选，出现多选框
        multiselectWidth: 25, //设置多选列宽度
        colNames:['商户编号', '简称', '状态','类型','电话','注册时间','到期时间'],
        colModel:[
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
        ],
        rowNum:10,
        rowList:[10,20,30],
        pager: '#pager',
        sortname: 'create_time',
        sortorder:'desc',
        viewrecords: true,      
        caption:"商户列表",
        autowidth: true, //自动匹配宽度
        editurl:"/merchants/",
        height: 300,
        loadComplete:function(data){ //完成服务器请求后，回调函数
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
     
      
	$("#add_btn").click(function() {
		$.fancybox({
			'title': '新增商户',
			'autoDimensions': false,
			'type': 'ajax',
			'href': '/merchants',
			'width': 700,
			'height': 800,
			'modal': true,
			'titleShow': true,
			'titlePosition': 'over',
			'showCloseButton': true,
			'showNavArrows': false,
			'transitionIn': 'elastic', //（效果出入）属性值有三个：fade,elastic,none,含义分别为淡入淡出、弹性缩放、无，默认值为fade。
			'transitionOut': 'elastic',
			'centerOnScroll': false,
			'onComplete': function() {
				$("#fancybox-title").css({
					'top': '0px',
					'bottom': 'auto'
				});
			}
		});
	}); 

        
	$("#view_btn").click(function() {
		var sels = $("#list").jqGrid('getGridParam', 'selarrrow');
		if(sels == "") {
			$().message("请选择要查看的项！");
		} else {
			if(sels.toString().indexOf(',') > 0) {
				$().message("只可选择一项进行查看！");
			} else {
				$.fancybox({
					'title': '查看门店信息',
					'titleFormat': function(title, currentArray, currentIndex, currentOpts) {
						var str = '<span id="fancybox-title-over">' + (currentIndex + 1) + ' / ' + currentArray.length + (title.length ? '   ' + title : '') + '</span>';
						return str;
					},
					'autoDimensions': false,
					'type': 'ajax',
					'href': '/merchants/' + sels + "/false",
					'width': 500,
					'height': 800,
					'modal': true,
					'titleShow': true,
					'titlePosition': 'over',
					'cyclic': true,
					'showCloseButton': true,
					'showNavArrows': false,
					'transitionIn': 'elastic', //（效果出入）属性值有三个：fade,elastic,none,含义分别为淡入淡出、弹性缩放、无，默认值为fade。
					'transitionOut': 'elastic',
					'centerOnScroll': false,
					'onComplete': function(data) {
						$("#fancybox-title").css({
							'top': '0px',
							'bottom': 'auto'
						});
					}
				});
			}
		}
	});
	$("#edit_btn").click(function() {
		var sels = $("#list").jqGrid('getGridParam', 'selarrrow');
		if(sels == "") {
			$().message("请选择要编辑的项！");
		} else {
			if(sels.toString().indexOf(',') > 0) {
				$().message("只可选择一项进行编辑！");
			} else {
				$.fancybox({
					'title': '修改门店信息',
					'titleFormat': function(title, currentArray, currentIndex, currentOpts) {
						var str = '<span id="fancybox-title-over">' + (currentIndex + 1) + ' / ' + currentArray.length + (title.length ? '   ' + title : '') + '</span>';
						return str;
					},
					'autoDimensions': false,
					'type': 'ajax',
					'href': '/merchants/' + sels + "/true",
					'width': 500,
					'height': 800,
					'modal': true,
					'titleShow': true,
					'titlePosition': 'over',
					'cyclic': true,
					'showCloseButton': true,
					'showNavArrows': false,
					'transitionIn': 'elastic', //（效果出入）属性值有三个：fade,elastic,none,含义分别为淡入淡出、弹性缩放、无，默认值为fade。
					'transitionOut': 'elastic',
					'centerOnScroll': false,
					'onComplete': function() {
						$("#fancybox-title").css({
							'top': '0px',
							'bottom': 'auto'
						});
					}
				});
			}
		}
	});
	$("#del_btn").click(function() {
		var sels = $("#list").jqGrid('getGridParam', 'selarrrow');
		if(sels == "") {
			alert('请选择要删除的项！')
		} else {
			if(confirm("您是否确认删除？")) {
				$.ajax({
					type: "delete",
					url: "/merchants/" + sels,
					//data: "_csrf=#{csrf}",
					beforeSend: function() {
						$().message("正在请求...");
					},
					error: function() {
						$().message("请求失败...");
					},
					success: function(msg) {
						if(msg._ids) {
							var arr = msg._ids.split(',');
							$.each(arr, function(i, n) {
								if(arr[i] != "") {
									$("#list").jqGrid('delRowData', n);
								}
							});
							$().message("已成功删除!");
						} else {
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