local key = KEYS[1]
local app_key = string.match(key, "(.*)%.user%.")
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
  redis.log(redis.LOG_DEBUG, "App key is not ok.")
  return nil
else
  redis.log(redis.LOG_DEBUG, "App key is ok.")
end

local user_id = string.match(key, ".*%.user%.(.*)%.")
local session_token = ARGV[2]

-- #include check_user_session.lua:
-- Input:
--   local app_key
--   local user_id
--   local session_token
-- Output:
--   local session_token_valid

-- Select the private session database
redis.call("SELECT", 1)
-- Get user private session secret
local user_session_secret = redis.call("GET", app_key .. ".user." .. user_id)
redis.call("SELECT", 0)

-- Require each user session to have a secret.
local session_token_valid = false
if not user_session_secret then
  redis.log(redis.LOG_DEBUG, "No user session secret for user " .. user_id .. " app " .. app_key)
  session_token_valid = false
else
  local should_be_session_token = redis.sha1hex(app_key .. ".user." .. user_id .. user_session_secret)
  redis.log(redis.LOG_DEBUG, "User session_token is " .. session_token .. " should be " .. should_be_session_token)
  session_token_valid = session_token == should_be_session_token
  -- If session token valid, refresh user session secret
  if session_token_valid then
    -- Refresh user session for 5 minutes.
    redis.call("SELECT", 1)
    redis.call("SET", app_key .. ".user." .. user_id, user_session_secret, "EX", 300)
    redis.call("SELECT", 0)
  end 
end


-- End of check_user_session.lua
if not session_token_valid then
  redis.log(redis.LOG_DEBUG, "Session token is not ok.")
  return nil
else
  redis.log(redis.LOG_DEBUG, "Session token is ok.")
end

redis.log(redis.LOG_DEBUG, "Number of args is " .. #ARGV)
if #ARGV == 3 then
  redis.log("Setting " .. key .. " with value " .. ARGV[3])
  redis.call("SET", key, ARGV[3])
elseif #ARGV == 4 then
  redis.call("SET", key, ARGV[3], ARGV[4])
elseif #ARGV == 5 then
  redis.call("SET", key, ARGV[3], ARGV[4], ARGV[5])
elseif #ARGV == 6 then
  redis.call("SET", key, ARGV[3], ARGV[4], ARGV[5], ARGV[6])
elseif #ARGV == 7 then
  redis.call("SET", key, ARGV[3], ARGV[4], ARGV[5], ARGV[6], ARGV[7])
end

