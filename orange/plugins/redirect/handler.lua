local pairs = pairs
local string_len = string.len
local string_find = string.find
local judge = require("orange.utils.judge")
local BasePlugin = require("orange.plugins.base")


local RedirectHandler = BasePlugin:extend()
RedirectHandler.PRIORITY = 2000

function RedirectHandler:new(store)
    RedirectHandler.super.new(self, "redirect-plugin")
    self.store = store
end

function RedirectHandler:redirect()
    RedirectHandler.super.redirect(self)
    local redirect_config = self.store:get_redirect_config()
    if redirect_config.enable ~= true then
        return
    end

    local redirect_rules = redirect_config.redirect_rules

    local ngx_set_uri = ngx.req.set_uri
    local ngx_re_gsub = ngx.re.gsub
    local ngx_redirect = ngx.redirect
    local ngx_var = ngx.var
    local ngx_var_uri = ngx_var.uri
    local ngx_var_scheme = ngx_var.scheme
    local ngx_var_host = ngx_var.http_host

    for i, rule in pairs(redirect_rules) do
        local enable = rule.enable
        if enable == true then
            local judge = rule.judge
            local match_type = judge.type
            local conditions = judge.conditions
            local pass = false
            if match_type == 0 or match_type == 1 then
                pass = judge.filter_and_conditions(conditions)
            elseif match_type == 2 then
                pass = judge.filter_or_conditions(conditions)
            elseif match_type == 3 then
                pass = judge.filter_complicated_conditions(judge.expression, conditions, self:get_name())
            end

            if pass then
                local handle = rule.handle

                if handle and handle.redirect_to then
                    local new_url
                    local replace_re = handle.regrex
                    if replace_re and replace_re ~= "" then
                        new_url = ngx_re_gsub(ngx_var_uri, replace_re, handle.redirect_to)
                    else
                        new_url = handle.redirect_to
                    end

                    if new_url ~= ngx_var_uri then
                        if string_find(new_url, 'http') ~= 1 then
                            new_url = ngx_var_scheme.."://"..ngx_var_host..new_url
                        end

                        if ngx_var.args ~= nil then
                            ngx_redirect( new_url.."?"..ngx_var.args , ngx.HTTP_MOVED_TEMPORARILY)
                        else
                            ngx_redirect( new_url , ngx.HTTP_MOVED_TEMPORARILY)
                        end

                        if handle.log == true then
                            ngx.log(ngx.ERR, "[Redirect] ", ngx_var_uri, " to:",  new_url)
                        end

                    end

                    return
                end
            end
        end
    end
end

return RedirectHandler