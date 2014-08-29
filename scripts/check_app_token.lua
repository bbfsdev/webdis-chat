-- Input:
--   local app_key
--   local app_token
-- Output:
--   local token_valid

-- Select the private session database
redis.call("SELECT", 1)
local app_secret = redis.call("GET", app_key)
redis.call("SELECT", 0)

-- Require each application to have a secret.
local token_valid = false
if not app_secret then
  redis.log(redis.LOG_DEBUG, "No application secret for app " .. app_key)
  token_valid = false
else
  local sould_be_app_token = redis.sha1hex(app_key .. app_secret)

  -- Check app token
  if app_token == sould_be_app_token then
    token_valid = true
  else
    redis.log(redis.LOG_DEBUG, "Bad user app_token:" .. app_token .. " should be:" .. sould_be_app_token)
    token_valid = false
  end
end
