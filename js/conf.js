var conf = (function () {
  if (!ISADMIN) {
    // User conf
    return {
      'interval': 7000,
      'max_interval': 120000,
      'reload_interval': 60000,
      'user_count_timeout': 9,  // in seconds
      'userLang': 'en'
    };
  }

  // Admin conf
  return {
    'interval': 3000,
    'max_interval': 12000,
    'reload_interval': 16000,
    'user_count_timeout': 9, // in seconds
    'refresh_count': 5000
  };
});
