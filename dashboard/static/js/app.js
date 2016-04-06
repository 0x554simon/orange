(function (L) {
    var _this = null;
    L.Common = L.Common || {};
    _this = L.Common = {
        data: {},
 
        init: function () {

        },

        //增加、删除条件按钮事件
        initConditionAddOrRemove: function () {

            //添加规则框里的事件
            //点击“加号“添加新的输入行
            $(document).on('click', '#add-rule-form .pair .btn-success', _this.addNewCondition);

            //删除输入行
            $(document).on('click', '#add-rule-form .pair .btn-danger', function (event) {
                $(this).parents('.form-group').remove();//删除本行输入
                _this.resetAddConditionBtn();
            });


            //编辑规则框里的事件
            //点击“加号“添加新的输入行
            $(document).on('click', '#edit-rule-form .pair .btn-success', _this.addNewCondition);

            //删除输入行
            $(document).on('click', '#edit-rule-form .pair .btn-danger', function (event) {
                $(this).parents('.form-group').remove();//删除本行输入
                _this.resetAddConditionBtn();
            });
        },

        //matcher类型选择事件
        initMatcherTypeChangeEvent: function () {
            $(document).on("change", '#rule-matcher-type', function () {
                var matcher_type = $(this).val();
                if (matcher_type != "0" && matcher_type != "1" && matcher_type != "2" && matcher_type != "3") {
                    L.Common.showTipDialog("提示", "选择的matcher类型不合法");
                    return
                }

                if (matcher_type == "3") {
                    $("#expression-area").show();
                } else {
                    $("#expression-area").hide();
                }
            });
        },

        //condition类型选择事件
        initConditionTypeChangeEvent: function () {
            $(document).on("change", 'select[name=rule-matcher-condition-type]', function () {
                var condition_type = $(this).val();

                if (condition_type != "Header" && condition_type != "Query") {
                    $(this).parents(".condition-holder").each(function () {
                        $(this).find(".condition-name-hodler").hide();
                    });
                } else {
                    $(this).parents(".condition-holder").each(function () {
                        $(this).find(".condition-name-hodler").show();
                    });
                }
            });
        },

        buildMatcher: function(){
            var result = {
                success: false,
                data: {
                    name: null,
                    matcher:{}
                }
            };
            var name = $("#rule-name").val();
            if(!name){
                result.success = false;
                result.data = "规则名称不能为空";
                return result;
            }

            result.data.name = name;

            

            var matcher_type = parseInt($("#rule-matcher-type").val());
            result.data.matcher.type = matcher_type;

            if(matcher_type == 3){
                var matcher_expression = $("#rule-matcher-expression").val();
                if(!matcher_expression){
                    result.success = false;
                    result.data = "复杂匹配的规则表达式不得为空";
                    return result;
                }
                result.data.matcher.expression = matcher_expression;
            }

            var matcher_conditions = [];

            var tmp_success = true;
            var tmp_tip = "";
            $(".condition-holder").each(function(){
                var self = $(this);
                var condition = {};
                var condition_type = self.find("select[name=rule-matcher-condition-type]").val();
                condition.type = condition_type;

                if(condition_type == "Header" || condition_type == "Query"){
                    var condition_name = self.find("input[name=rule-matcher-condition-name]").val();
                    if(!condition_name){
                        tmp_success = false;
                        tmp_tip = "condition的name字段不得为空";
                    }

                    condition.name = condition_name;
                }

                condition.operator = self.find("select[name=rule-matcher-condition-operator]").val();
                condition.value = self.find("input[name=rule-matcher-condition-value]").val() || "";

                matcher_conditions.push(condition);
            });

            if(!tmp_success){
                result.success = false;
                result.data = tmp_tip;
                return result;
            }
            result.data.matcher.conditions = matcher_conditions;

            //判断规则类型和条件个数是否匹配
            if(result.data.matcher.conditions.length<1){
                result.success = false;
                result.data = "请配置规则条件";
                return result;
            }
            if(result.data.matcher.type==0 && result.data.matcher.conditions.length!=1){
                result.success = false;
                result.data = "单一条件匹配模式只能有一条condition，请删除多余配置";
                return result;
            }
            if(result.data.matcher.type==3){//判断条件表达式与条件个数等
                try{
                    var condition_count = result.data.matcher.conditions.length;
                    var regrex1 = /(v\[[0-9]+\])/g;
                    var regrex2 = /([0-9]+)/g;
                    var expression_v_array = [];// 提取条件变量
                    expression_v_array = result.data.matcher.expression.match(regrex1);
                    if(!expression_v_array || expression_v_array.length<1){
                        result.success = false;
                        result.data = "规则表达式格式错误，请检查";
                        return result;
                    }

                    var expression_v_array_len = expression_v_array.length;
                    var max_v_index = 1;
                    for(var i = 0; i<expression_v_array_len; i++){
                        var expression_v = expression_v_array[i];
                        var index_array = expression_v.match(regrex2);
                        if(!index_array || index_array.length<1){
                            result.success = false;
                            result.data = "规则表达式中条件变量格式错误，请检查";
                            return result;
                        }

                        var var_index = parseInt(index_array[0]);
                        if(var_index>max_v_index){
                            max_v_index = var_index;
                        }
                    }

                    if(condition_count<max_v_index){
                        result.success = false;
                        result.data = "规则表达式中的变量最大索引[" + max_v_index + "]与条件个数[" + condition_count + "]不相符，请检查";
                        return result;
                    }
                }catch(e){
                    result.success = false;
                    result.data = "条件表达式验证发生异常:"+e;
                    return result;
                }                
            }

            result.success = true;
            return result;
        },

        showRulePreview: function (rule) {
            var content = "";
            
            if (rule.success == true) {
                content = '<pre id="preview_rule"><code></code></pre>';
            } else {
                content = rule.data;
            }

            var d = dialog({
                title: '规则预览',
                width: 500,
                content: content,
                modal: true,
                button: [{
                    value: '返回',
                    callback: function () {
                        d.close().remove();
                    }
                }
                ]
            });
            d.show();

            $("#preview_rule code").text(JSON.stringify(rule.data, null, 2));
            $('pre code').each(function () {
                hljs.highlightBlock($(this)[0]);
            });
        },

        addNewCondition: function (event) {
            var self = $(this);
            var row = self.parents('.condition-holder');
            var new_row = row.clone(true);
            // $(new_row).find("input[name=rule-matcher-condition-value]").val("");
            // $(new_row).find("input[name=rule-matcher-condition-name]").val("");

            var old_type = $(row).find("select[name=rule-matcher-condition-type]").val();
            $(new_row).find("select[name=rule-matcher-condition-type]").val(old_type);

            var old_operator = $(row).find("select[name=rule-matcher-condition-operator]").val();
            $(new_row).find("select[name=rule-matcher-condition-operator]").val(old_operator);

            $(new_row).insertAfter($(this).parents('.condition-holder'))
            _this.resetAddConditionBtn();
        },

        resetAddConditionBtn: function () {
            var l = $(".pair").length;
            var c = 0;
            $(".pair").each(function () {
                c++;
                if (c == l) {
                    $(this).find(".btn-success").show();
                    $(this).find(".btn-danger").show();
                } else {
                    $(this).find(".btn-success").hide();
                    $(this).find(".btn-danger").show();
                }
            })
        },

        
        showTipDialog: function (title, content) {
            if (!content) {
                content = title;
                title = "Tips";
            }
            var d = dialog({
                title: title || 'Tips',
                content: content,
                width: 350,
                cancel: false,
                ok: function () {
                }
            });
            d.show();
        },
        
        resetNav: function(select){
            $("#main-nav-menu li").each(function(){
                $(this).removeClass("active")
            });

            if(select){
                $("#main-nav-menu li#"+select).addClass("active");
            }
        },
 
        formatDate: function (now) {
            now = now || new Date();
            var year = now.getFullYear();
            var month = now.getMonth() + 1;
            var date = now.getDate();
            var hour = now.getHours();
            var minute = now.getMinutes();
            var second = now.getSeconds();
            if (minute < 10) minute = "0" + minute;
            if (hour < 10) hour = "0" + hour;
            if (second < 10) second = "0" + second;
            return year + "-" + month + "-" + date + " " + hour + ":" + minute + ":" + second;
        },

        formatTime: function (now) {
            now = now || new Date();
            var hour = now.getHours();
            var minute = now.getMinutes();
            var second = now.getSeconds();
            if (minute < 10) minute = "0" + minute;
            if (hour < 10) hour = "0" + hour;
            if (second < 10) second = "0" + second;
            return hour + ":" + minute + ":" + second;
        }

    };
}(APP));