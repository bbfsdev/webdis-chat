// Include app.js for this to work

// All application keys
// Key example chat.we.kab.tv.users.count
KEY_USERS_COUNT = function() { return ["chat", getLabel(), "users", "count"].join(".") ; };
KEY_USER = function(user_id) { return ["chat", getLabel(), "user", user_id].join(".") ; };
KEY_SHOULD_UPDATE = function() { return ["chat", getLabel(), "should_update"].join(".") ; };
KEY_QUESTIONS_COUNT = function() { return ["chat", getLabel(), "questions", "count"].join(".") ; };
KEY_QUESTION = function(question_id) { return ["chat", getLabel(), "question", question_id].join(".") ; };
KEY_RESTART = function() { return ["chat", getLabel(), "restart"].join("."); };


// Interface methods
var getQuestions = function(callback) {
  keys(KEY_QUESTION("*"), function(keys) {
    mget(keys.KEYS, function(data) {
      var db = [];
      for (var idx in data.MGET) {
        if (data.MGET[idx] != null) {
          question = read_question(data.MGET[idx]);
          db.push(question);
        }
      }
      db.sort(function(a,b){return a.timestamp-b.timestamp});
      callback(db);
    });
  });
};

var latest_question = "";
var sholdUpdate = function (callback) {
  get_Ikey(KEY_SHOULD_UPDATE(), function(res) {
    if (latest_question != res) {
      latest_question = res;
      callback(true);
    } else {
      callback(false);
    }
  });
};

var updateUser = function () {
  incr(KEY_USERS_COUNT(), function(user_id) {
    setInterval(function() {
      set_key(KEY_USER(user_id), "live", function() {}, conf.user_count_timeout);
    }, conf.user_count_timeout * 1000);
  });
}

var getPollWidget = function() {
  // Not implemented
  return null;
};

var updatePollWidget = function() {
  // Not implemented
  return null;
};

// START of Debug mode
var debug_mode = true;
if (debug_mode) {
  getQuestions = function(callback) {
    var data = [{
        'lang': TRANSLATION.lang,
        'name': 'name',
        'from': 'from',
        'question': 'question',
        'approve': true,
        'id': 1,
        'timestamp': function () {
          return new Date();
        }()
    },{
        'lang': TRANSLATION.lang,
        'name': 'name',
        'from': 'from',
        'question': 'question',
        'approve': false,
        'id': 1,
        'timestamp': function () {
          return new Date();
        }()
    }];
    callback(data);
  };
  sholdUpdate = function(callback){
    return callback(true);
  };
  updateUser = function(){return true;};

  getPollWidget = function() {
    return {
      'question': 'What is ligh',
      'answers': [
      ]
    };
  };

  updatePollWidget = function() {
  };
}
// END of Debug mode


// Local methods

function getParameter(name) {
  var ret = $.url('?' + name);
  if (!ret) {
    return ret;
  }
  return $('<div/>').html(decodeURIComponent(ret)).text();
}

var label = null;
function getLabel() {
  if (label) {
    return label;
  }

  label = getParameter('label');
  if (!label) {
    label = conf.host;
  }

  return label;
}

function userCount(callback) {
  keys(KEY_USER("*"), function(users) {
    callback(users.KEYS.length);
  });
}

function addQuestion(name, from, question) {
  incr(KEY_QUESTIONS_COUNT(), function(id) {
    get_timestamp(function(time_now) {
      var q = {
        'lang': TRANSLATION.lang,
        'name': name,
        'from': from,
        'question': question,
        'approve': false,
        'id': KEY_QUESTION(id),
        'timestamp': time_now
      }
      setQuestion(q);
    });
  });
}

function setQuestion(q) {
  set_key(q.id, $.param(q));
  incr(KEY_SHOULD_UPDATE(), function(data) {});
}

function read_question(q) {
  var ret = $.deparam(q);
  if (ret.approve == 'true') {
    ret.approve = true;
  } else {
    ret.approve = false;
  } 
  if ('timestamp' in ret) {
    ret.timestamp = parseInt(ret.timestamp);
  } else {
    ret['timestamp'] = 0;
  }
  return ret;
}

function toggleQuestion(id, approved) {
  get_key(id, function(q) {
    var question = read_question(q);
    question.approve = approved;
    setQuestion(question);
  });
}

function deleteQuestion(id) {
  del(id);
  incr(KEY_SHOULD_UPDATE(), function(data) {});
}

function questionEq(a, b, limit) {
  if (a.length < limit || b.length < limit) {
    return false;
  }
  
  for (var idx = 0; idx < limit; ++idx) {
    if (a[idx] != b[idx]) {
      return false;
    }
  }
  
  return true;
}



$(document).ready(function () {
  initUserPage();
  startIntervals();
});


function initUserPage() {
  initUserLang();
  PLUGINS.setLang();
  updateUser();
  $('.btn').button();//use jquery UI buttons

  PLUGINS.initAskForm($('#askBtn'), $("#askForm"));
  PLUGINS.initExportBtn($('#exportBtn'));
  
  getQuestions(PLUGINS.setHtmlAllQuestions);
};

function initUserLang () {
  var lang = getParameter('lang');
  TRANSLATION.lang = (lang != null) ? lang: TRANSLATION.lang; 
  
}

function startIntervals() {    
  // Updates questions list.
  setInterval(function () {
    sholdUpdate(function(should_update) {
      if (should_update) {
        getQuestions(PLUGINS.setHtmlAllQuestions);
      }
    });
  }, conf.interval);
  if (debug_mode) return;
  // Loads new version of chat (new code) if needed.
  setInterval(function() {
    get_key(KEY_RESTART(), function(res) {
      if (res == 'true') {
        location.reload();
      }
    });
  }, conf.reload_interval);
}
