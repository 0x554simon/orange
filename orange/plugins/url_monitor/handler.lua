local BasePlugin = require("orange.plugins.base")
local stat = require("orange.plugins.url_monitor.stat")

local URLMonitorHandler = BasePlugin:extend()

URLMonitorHandler.PRIORITY = 2000

function URLMonitorHandler:new()
    URLMonitorHandler.super.new(self, "url-monitor-plugin")
end

function URLMonitorHandler:init_worker(conf)
    stat.init()
end

function URLMonitorHandler:log(conf)
    stat.log()
end

return URLMonitorHandler