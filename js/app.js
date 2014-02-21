// All application javascript methods for webdis/redis.

// Assumes conf was defines with following parameters 
//  'host': URL where application reside.
//  'webdis': URL where redis (vis webdis) reside.'

var handle_error = function(err) {
  debug = $.url('?debug');
  if (debug) {
  // Uncomment for debuging XHR (ajax). 
    alert(err);
  }
};

function incr(key, callback) {
  $.ajax({
    cache: false,
    url: location.protocol + "//" + conf.webdis + "/INCR/" + encodeURIComponent(key),
    timeout: 8000,
    data: "format=json",
    dataType: "json",
    success: function(data) { callback(data.INCR) },
    error: function(xhr, status, errorThrown) { handle_error(errorThrown+'\n'+status+'\n'+xhr.statusText); }
  });
}

function get_key(key, callback) {
  $.ajax({
    cache: false,
    url: location.protocol + "//" + conf.webdis + "/GET/" + encodeURIComponent(key),
    timeout: 8000,
    data: "format=json",
    dataType: "json",
    success: function(data) { callback(data.GET) },
    error: function(xhr, status, errorThrown) { handle_error(errorThrown+'\n'+status+'\n'+xhr.statusText); } 
  });
}

function set_key(key, value, callback, expire) {
  var expire_url = "";
  if (expire) {
    expire_url = "/EX/" + expire;
  }
  var set_request = location.protocol + "//" + conf.webdis + "/SET/" + encodeURIComponent(key) + "/" + encodeURIComponent(value) + expire_url;
  $.ajax({
    cache: false,
    url: set_request,
    timeout: 8000,
    data: "format=json",
    dataType: "json",
    success: callback,
    error: function(xhr, status, errorThrown) { handle_error(errorThrown+'\n'+status+'\n'+xhr.statusText); } 
  });
}

function keys(pattern, callback) {
  $.ajax({
    cache: false,
    url: location.protocol + "//" + conf.webdis + "/KEYS/" + encodeURIComponent(pattern),
    timeout: 8000,
    dataType: "text",
    success: function(data) { callback($.parseJSON(data)); },
    error: function(xhr, status, errorThrown) { handle_error(errorThrown+'\n'+status+'\n'+xhr.statusText); } 
  });
}

function mget(key_arr, callback) {
  // TODO(kolman): Add encode URI Component for all other $.ajax calls!
  // Check, this may be needed for IE only?
  var url = location.protocol + "//" + conf.webdis + "/MGET/" + encodeURIComponent(key_arr.join("/"));
  if (url.length > 2000 && key_arr.length > 2) {
    var first = key_arr.slice(0, key_arr.length/2);
    mget(first, function(first_data) {
      var second = key_arr.slice(key_arr.length/2, key_arr.length);
      mget(second, function(data) {
        data.MGET.push.apply(data.MGET, first_data.MGET);
        callback(data);
      }); 
    });
  } else {
    $.ajax({
      cache: false,
      url: url,
      timeout: 8000,
      dataType: "text",
      success: function(data) { callback($.parseJSON(data)); },
      error: function(xhr, status, errorThrown) { handle_error('mget\n' + errorThrown+'\n'+status+'\n'+xhr.statusText); } 
    });
  }
}

function del(key, callback) {
  var url = location.protocol + "//" + conf.webdis + "/DEL/" + encodeURIComponent(key);
  $.ajax({
    cache: false,
    url: url, 
    timeout: 8000,
    data: "format=json",
    dataType: "json",
    success: callback,
    error: function(xhr, status, errorThrown) { handle_error(errorThrown+'\n'+status+'\n'+xhr.statusText); } 
  });
}

function get_timestamp(callback) {
  $.ajax({
    cache: false,
    url: location.protocol + "//" + conf.webdis + "/TIME",
    timeout: 8000,
    data: "format=json",
    dataType: "json",
    success: function(data) { callback(data.TIME[0]); },
    error: function(xhr, status, errorThrown) { handle_error(errorThrown+'\n'+status+'\n'+xhr.statusText); } 
  });
}

var isMobile = {
    Android: function() {
        return navigator.userAgent.match(/Android/i);
    },
    BlackBerry: function() {
        return navigator.userAgent.match(/BlackBerry/i);
    },
    iOS: function() {
        return navigator.userAgent.match(/iPhone|iPad|iPod/i);
    },
    Opera: function() {
        return navigator.userAgent.match(/Opera Mini/i);
    },
    Windows: function() {
        return navigator.userAgent.match(/IEMobile/i);
    },
    any: function() {
        return (isMobile.Android() || isMobile.BlackBerry() || isMobile.iOS() || isMobile.Opera() || isMobile.Windows());
    }
};

