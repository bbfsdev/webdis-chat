local app_key = KEYS[1]
local app_token = ARGV[1]

-- #include check_app_token.lua:
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

-- End of check_app_token.lua
if not token_valid then
  return nil
end

-- Go to session database
redis.call("SELECT", 1)

local user_session_secret = redis.call("GET", app_key .. ".next_user_session")
redis.call("SET", app_key .. ".next_user_session", redis.sha1hex(user_session_secret))
local user_id = redis.call("INCR", app_key .. ".users.count")

-- Refresh user session for 5 minutes.
redis.call("SET", app_key .. ".user." .. user_id, user_session_secret, "EX", 300)

-- Return back to original database
redis.call("SELECT", 0)

return {user_id, redis.sha1hex(app_key .. ".user." .. user_id .. user_session_secret)}

