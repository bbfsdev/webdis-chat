var conf = {
  'host': 'localhost',
  'webdis': 'localhost/webdis',
  'interval': 30000,
  'max_interval': 120000,
  'reload_interval': 60000,
  'user_count_timeout': 90,  // in seconds
  'userLang': 'en'
}



data = {
        'lang': lang,
        'name': name,
        'from': from,
        'question': question,
        'approve': false,
        'id': KEY_QUESTION(id),
        'timestamp': time_now
}