local key = KEYS[1]
local app_key = string.match(key, "(.*)%.user%.")
local app_token = ARGV[1]
#include 'check_app_token.lua'
if not token_valid then
  redis.log(redis.LOG_DEBUG, "App key is not ok.")
  return nil
else
  redis.log(redis.LOG_DEBUG, "App key is ok.")
end

local user_id = string.match(key, ".*%.user%.(.*)%.")
local session_token = ARGV[2]
#include 'check_user_session.lua'
if not session_token_valid then
  redis.log(redis.LOG_DEBUG, "Session token is not ok.")
  return nil
else
  redis.log(redis.LOG_DEBUG, "Session token is ok.")
end

-- Execute set command
if #ARGV == 3 then
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

