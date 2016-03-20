local file_store = require("orange.store.file_store")

local API = {}


API["/redirect/configs"] = {
    GET = function(store)
        return function(req, res, next)
            local result = {
                success = true,
                data = store:get_redirect_config()
            }

            res:json(result)
        end
    end
}

return API