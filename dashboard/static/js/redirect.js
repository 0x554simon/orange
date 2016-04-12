(function (L) {
    var _this = null;
    L.Redirect = L.Redirect || {};
    _this = L.Redirect = {
        data: {
            rules: {},
            ruletable: null
        },

        init: function () {
            _this.loadConfigs();
            _this.initEvents();

        },

        initEvents: function () {
            _this.initRuleAddDialog();//添加规则对话框
            _this.initRuleDeleteDialog();//删除规则对话框
            _this.initRuleEditDialog();//编辑规则对话框

            L.Common.initConditionAddOrRemove();//添加或删除条件
            L.Common.initJudgeTypeChangeEvent();//judge类型选择事件
            L.Common.initConditionTypeChangeEvent();//condition类型选择事件

            L.Common.initExtractionAddOrRemove();//添加或删除条件
            L.Common.initExtractionTypeChangeEvent();//extraction类型选择事件
            L.Common.initExtractionAddBtnEvent();//添加提前项按钮事件

            _this.initSwitchBtn();//redirect关闭、开启

            $("#view-btn").click(function () {//试图转换
                var self = $(this);
                var now_state = $(this).attr("data-type");
                if (now_state == "table") {//当前是表格视图，点击切换到数据视图
                    self.attr("data-type", "database");
                    self.find("i").removeClass("fa-database").addClass("fa-table");
                    self.find("span").text("表格视图");

                    var showData = {
                        enable: _this.data.enable,
                        redirect_rules: _this.data.rules
                    }
                    jsonformat.format(JSON.stringify(showData));
                    $("#jfContent_pre").text(JSON.stringify(showData, null, 4));
                    $('pre').each(function () {
                        hljs.highlightBlock($(this)[0]);
                    });
                    $("#table-view").hide();
                    $("#database-view").show();
                } else {
                    self.attr("data-type", "table");
                    self.find("i").removeClass("fa-table").addClass("fa-database");
                    self.find("span").text("数据视图");

                    $("#database-view").hide();
                    $("#table-view").show();
                }
            });

            $(document).on("click", "#btnDownload", function () {//规则json下载
                var downloadData = {
                    enable: _this.data.enable,
                    redirect_rules: _this.data.rules
                }
                var blob = new Blob([JSON.stringify(downloadData, null, 4)], {type: "text/plain;charset=utf-8"});
                saveAs(blob, "data.json");
            });
        },


        initSwitchBtn: function (enable) {
            $("#switch-btn").click(function () {//是否开启redirect
                var self = $(this);
                var now_state = $(this).attr("data-on");
                if (now_state == "yes") {//当前是开启状态，点击则“关闭”
                    var d = dialog({
                        title: 'redirect设置',
                        width: 300,
                        content: "确定要关闭redirect吗？",
                        modal: true,
                        button: [{
                            value: '取消'
                        }, {
                            value: '确定',
                            autofocus: false,
                            callback: function () {
                                $.ajax({
                                    url: '/redirect/enable',
                                    type: 'post',
                                    data: {
                                        enable: "0"
                                    },
                                    dataType: 'json',
                                    success: function (result) {
                                        if (result.success) {
                                            //重置按钮
                                            _this.data.enable = false;
                                            self.attr("data-on", "no");
                                            self.removeClass("btn-danger").addClass("btn-info");
                                            self.find("i").removeClass("fa-pause").addClass("fa-play");
                                            self.find("span").text("启用redirect");

                                            return true;
                                        } else {
                                            L.Common.showErrorTip("提示", result.msg || "关闭redirect发生错误");
                                            return false;
                                        }
                                    },
                                    error: function () {
                                        L.Common.showErrorTip("提示", "关闭redirect请求发生异常");
                                        return false;
                                    }
                                });
                            }
                        }
                        ]
                    });
                    d.show();


                } else {
                    var d = dialog({
                        title: 'redirect设置',
                        width: 300,
                        content: "确定要开启redirect吗？",
                        modal: true,
                        button: [{
                            value: '取消'
                        }, {
                            value: '确定',
                            autofocus: false,
                            callback: function () {
                                $.ajax({
                                    url: '/redirect/enable',
                                    type: 'post',
                                    data: {
                                        enable: "1"
                                    },
                                    dataType: 'json',
                                    success: function (result) {
                                        if (result.success) {
                                            _this.data.enable = true;
                                            //重置按钮
                                            self.attr("data-on", "yes");
                                            self.removeClass("btn-info").addClass("btn-danger");
                                            self.find("i").removeClass("fa-play").addClass("fa-pause");
                                            self.find("span").text("停用redirect");

                                            return true;
                                        } else {
                                            L.Common.showErrorTip("提示", result.msg || "开启redirect发生错误");
                                            return false;
                                        }
                                    },
                                    error: function () {
                                        L.Common.showErrorTip("提示", "开启redirect请求发生异常");
                                        return false;
                                    }
                                });
                            }
                        }
                        ]
                    });
                    d.show();

                }
            });
        },

        

        buildRule: function () {
            var result = {
                success: false,
                data: {
                    name: null,
                    judge: {},
                    extractor: {},
                    handle: {}
                }
            };

            //build name and judge
            var buildJudgeResult = L.Common.buildJudge();
            if (buildJudgeResult.success == true) {
                result.data.name = buildJudgeResult.data.name;
                result.data.judge = buildJudgeResult.data.judge;
            } else {
                result.success = false;
                result.data = buildJudgeResult.data;
                return result;
            }

            //build extractor
            var buildExtractorResult = L.Common.buildExtractor();
            if (buildExtractorResult.success == true) {
                result.data.extractor = buildExtractorResult.data.extractor;
            } else {
                result.success = false;
                result.data = buildExtractorResult.data;
                return result;
            }

            //build handle
            var buildHandleResult = _this.buildHandle();
            if (buildHandleResult.success == true) {
                result.data.handle = buildHandleResult.handle;
            } else {
                result.success = false;
                result.data = buildHandleResult.data;
                return result;
            }

            //enable or not
            var enable = $('#rule-enable').is(':checked');
            result.data.enable = enable;

            result.success = true;
            return result;
        },


        buildHandle: function () {
            var result = {};
            var handle = {};
            var url_tmpl = $("#rule-handle-url-template").val();
            if (!url_tmpl) {
                result.success = false;
                result.data = "要跳转到的url template不得为空";
                return result;
            }
            handle.url_tmpl = url_tmpl;
            handle.trim_qs = ($("#rule-handle-trim-qs").val() === "true");
            handle.log = ($("#rule-handle-log").val() === "true");
            result.success = true;
            result.handle = handle;
            return result;
        },

        initRuleAddDialog: function () {
            $("#add-btn").click(function () {
                var content = $("#add-tpl").html()
                var d = dialog({
                    title: '添加规则',
                    width: 680,
                    content: content,
                    modal: true,
                    button: [{
                        value: '取消'
                    }, {
                        value: '预览',
                        autofocus: false,
                        callback: function () {
                            var rule = _this.buildRule();
                            L.Common.showRulePreview(rule);
                            return false;
                        }
                    }, {
                        value: '确定',
                        autofocus: false,
                        callback: function () {
                            var result = _this.buildRule();
                            if (result.success == true) {
                                $.ajax({
                                    url: '/redirect/configs',
                                    type: 'put',
                                    data: {
                                        rule: JSON.stringify(result.data)
                                    },
                                    dataType: 'json',
                                    success: function (result) {
                                        if (result.success) {
                                            //重新渲染规则

                                            _this.data.rules = result.data.redirect_rules;//重新设置数据
                                            _this.renderTable(result.data, _this.data.rules[_this.data.rules.length - 1].id);//渲染table

                                            return true;
                                        } else {
                                            L.Common.showErrorTip("提示", result.msg || "添加规则发生错误");
                                            return false;
                                        }
                                    },
                                    error: function () {
                                        L.Common.showErrorTip("提示", "添加规则请求发生异常");
                                        return false;
                                    }
                                });

                            } else {
                                L.Common.showErrorTip("错误提示", result.data);
                                return false;
                            }
                        }
                    }
                    ]
                });
                L.Common.resetAddConditionBtn();//删除增加按钮显示与否
                d.show();
            });
        },

        initRuleEditDialog: function () {
            $(document).on("click", ".edit-btn", function () {
                var tpl = $("#edit-tpl").html();
                var rule_id = $(this).attr("data-id");
                var rule = {};
                var rules = _this.data.rules;
                for (var i = 0; i < rules.length; i++) {
                    var r = rules[i];
                    if (r.id == rule_id) {
                        rule = r;
                        break;
                    }
                }
                if (!rule_id || !rule) {
                    L.Common.showErrorTip("提示", "要编辑的规则不存在或者查找出错");
                    return;
                }


                var html = juicer(tpl, {
                    r: rule
                });

                var d = dialog({
                    title: "编辑规则",
                    width: 680,
                    content: html,
                    modal: true,
                    button: [{
                        value: '取消'
                    }, {
                        value: '预览',
                        autofocus: false,
                        callback: function () {
                            var rule = _this.buildRule();
                            L.Common.showRulePreview(rule);
                            return false;
                        }
                    }, {
                        value: '保存修改',
                        autofocus: false,
                        callback: function () {
                            var result = _this.buildRule();
                            result.data.id = rule.id;//拼上要修改的id

                            if (result.success == true) {
                                $.ajax({
                                    url: '/redirect/configs',
                                    type: 'post',
                                    data: {
                                        rule: JSON.stringify(result.data)
                                    },
                                    dataType: 'json',
                                    success: function (result) {
                                        if (result.success) {
                                            //重新渲染规则
                                            _this.renderTable(result.data, rule_id);//渲染table
                                            _this.data.rules = result.data.redirect_rules;//重新设置数据

                                            return true;
                                        } else {
                                            L.Common.showErrorTip("提示", result.msg || "编辑规则发生错误");
                                            return false;
                                        }
                                    },
                                    error: function () {
                                        L.Common.showErrorTip("提示", "编辑规则请求发生异常");
                                        return false;
                                    }
                                });

                            } else {
                                L.Common.showErrorTip("错误提示", result.data);
                                return false;
                            }
                        }
                    }
                    ]
                });

                L.Common.resetAddConditionBtn();//删除增加按钮显示与否
                d.show();
            });
        },

        initRuleDeleteDialog: function () {
            $(document).on("click", ".delete-btn", function () {

                var name = $(this).attr("data-name");
                var rule_id = $(this).attr("data-id");
                console.log("删除:" + name);
                var d = dialog({
                    title: '提示',
                    width: 480,
                    content: "确定要删除规则【" + name + "】吗？",
                    modal: true,
                    button: [{
                        value: '取消'
                    }, {
                        value: '确定',
                        autofocus: false,
                        callback: function () {
                            $.ajax({
                                url: '/redirect/configs',
                                type: 'delete',
                                data: {
                                    rule_id: rule_id
                                },
                                dataType: 'json',
                                success: function (result) {
                                    if (result.success) {
                                        //重新渲染规则
                                        _this.renderTable(result.data);//渲染table
                                        _this.data.rules = result.data.redirect_rules;//重新设置数据

                                        return true;
                                    } else {
                                        L.Common.showErrorTip("提示", result.msg || "删除规则发生错误");
                                        return false;
                                    }
                                },
                                error: function () {
                                    L.Common.showErrorTip("提示", "删除规则请求发生异常");
                                    return false;
                                }
                            });
                        }
                    }
                    ]
                });

                d.show();
            });
        },



        loadConfigs: function () {
            $.ajax({
                url: '/redirect/configs',
                type: 'get',
                data: {},
                dataType: 'json',
                success: function (result) {
                    if (result.success) {
                        _this.resetSwitchBtn(result.data.enable);
                        $("#switch-btn").show();
                        $("#view-btn").show();
                        _this.renderTable(result.data);//渲染table
                        _this.data.enable = result.data.enable;
                        _this.data.rules = result.data.redirect_rules;//重新设置数据

                    } else {
                        L.Common.showTipDialog("错误提示", "查询redirect配置请求发生错误");
                    }
                },
                error: function () {
                    L.Common.showTipDialog("提示", "查询redirect配置请求发生异常");
                }
            });
        },

        resetSwitchBtn: function (enable) {
            var self = $("#switch-btn");
            if (enable == true) {//当前是开启状态，则应显示“关闭”按钮
                self.attr("data-on", "yes");
                self.removeClass("btn-info").addClass("btn-danger");
                self.find("i").removeClass("fa-play").addClass("fa-pause");
                self.find("span").text("停用redirect");
            } else {
                self.attr("data-on", "no");
                self.removeClass("btn-danger").addClass("btn-info");
                self.find("i").removeClass("fa-pause").addClass("fa-play");
                self.find("span").text("启用redirect");
            }
        },

        renderTable: function (data, highlight_id) {
            highlight_id = highlight_id || 0;
            var tpl = $("#rule-item-tpl").html();
            data.highlight_id = highlight_id;
            var html = juicer(tpl, data);
            $("#rules").html(html);
        },

    };
}(APP));