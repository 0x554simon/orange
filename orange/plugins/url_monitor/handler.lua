local pairs = pairs
local ipairs = ipairs
local stat = require("orange.plugins.url_monitor.stat")
local judge_util = require("orange.utils.judge")
local handle_util = require("orange.utils.handle")
local BasePlugin = require("orange.plugins.base")

local URLMonitorHandler = BasePlugin:extend()
URLMonitorHandler.PRIORITY = 2000

function URLMonitorHandler:new(store)
    URLMonitorHandler.super.new(self, "url-monitor-plugin")
    self.store = store
end

function URLMonitorHandler:log(conf)
    URLMonitorHandler.super.log(self)
    local url_monitor_config = self.store:get("url_monitor_config")
    if url_monitor_config.enable ~= true then
        return
    end

    local ngx_var_uri = ngx.var.uri

    local rules = url_monitor_config.rules
    for i, rule in ipairs(rules) do
        local enable = rule.enable
        if enable == true then

            -- judge阶段
            local judge = rule.judge
            local judge_type = judge.type
            local conditions = judge.conditions
            local pass = false
            if judge_type == 0 or judge_type == 1 then
                pass = judge_util.filter_and_conditions(conditions)
            elseif judge_type == 2 then
                pass = judge_util.filter_or_conditions(conditions)
            elseif judge_type == 3 then
                pass = judge_util.filter_complicated_conditions(judge.expression, conditions, self:get_name())
            end

            -- handle阶段
            if pass then
                local key_suffix =  rule.id
                stat.count(key_suffix)

                local handle = rule.handle
                if handle then
                    if handle.log == true then
                        ngx.log(ngx.ERR, "[URLMonitor] ", rule.id, ":", ngx_var_uri)
                    end

                    if handle.continue == true then
                    else
                        return -- 不再匹配后续的规则，即不再统计满足后续规则的监控
                    end
                end
            end
        end
    end
end

return URLMonitorHandler