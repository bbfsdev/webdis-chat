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

