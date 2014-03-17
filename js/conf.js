var conf = (function () {
  if (!ISADMIN) {
    // User conf
    return {
      'host': 'localhost',
      'webdis': 'localhost/webdis',
      'interval': 30000,
      'max_interval': 120000,
      'reload_interval': 60000,
      'user_count_timeout': 90,  // in seconds
      'userLang': 'en'
    };
  }

  // Admin conf
  return {
    'host': 'localhost',
    'webdis': 'localhost/webdis',
    'interval': 3000,
    'max_interval': 12000,
    'reload_interval': 16000,
    'user_count_timeout': 30, // in seconds
    'refresh_count': 30000
  };
});
