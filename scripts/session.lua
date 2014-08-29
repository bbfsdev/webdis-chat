local app_key = KEYS[1]
local app_token = ARGV[1]
#include 'check_app_token.lua'
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

