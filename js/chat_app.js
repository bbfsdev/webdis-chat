// Include app.js for this to work

// All application keys
// Key example chat.we.kab.tv.users.count
KEY_USERS_COUNT = function() { return ["chat", getLabel(), "users", "count"].join(".") ; };
KEY_USER = function(user_id) { return ["chat", getLabel(), "user", user_id].join(".") ; };
KEY_SHOULD_UPDATE = function() { return ["chat", getLabel(), "should_update"].join(".") ; };
KEY_SHOULD_UPDATE_LABEL = function(label) { return ["chat", label, "should_update"].join(".") ; };
KEY_QUESTIONS_COUNT = function() { return ["chat", getLabel(), "questions", "count"].join(".") ; };
KEY_QUESTION = function(question_id) { return ["chat", getLabel(), "question", question_id].join(".") ; };
KEY_QUESTION_CUSTOM_LABEL = function(question_id, label) { return ["chat", label, "question", question_id].join(".") ; };
KEY_RESTART = function() { return ["chat", getLabel(), "restart"].join("."); };
KEY_AUTO_APPROVE = function() { return ["chat", getLabel(), "auto", "approve"].join("."); };


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

var deleteAllQuestions = function() {
  getQuestions(function(db) {
    var questions = [];
    for (var idx in db) {
      var question = db[idx];
      questions.push(question.id);
    }
    del_keys(questions, function(data) { alert(data.DEL + ' questions were deleted.'); });
    incr(KEY_SHOULD_UPDATE(), function(data) {});
  });
}

var latest_question = {};
var shouldUpdate = function (callback) {
  keys(KEY_SHOULD_UPDATE(), function(keys_data) {
    mget(keys_data.KEYS, function(data) {
      var ret = false;
      for (var idx in data.MGET) {
        var key = keys_data.KEYS[idx];
        var value = parseInt(data.MGET[idx]);
        if (!(key in latest_question)) {
          latest_question[key] = -1;
        }
        if (parseInt(latest_question[key]) < value) {
          latest_question[key] = value;
          ret = true;
        }
      }
      callback(ret);
    });
  });
};

var updateUser = function () {
  incr(KEY_USERS_COUNT(), function(user_id) {
    setInterval(function() {
      set_key(KEY_USER(user_id), "live", function() {}, conf().user_count_timeout);
    }, conf().user_count_timeout * 1000);
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
var debug_mode = false;
var ISADMIN = false;
if (debug_mode) {
  getQuestions = function(callback) {
    var allSmiles;
    $.each(EMOTIONS, function (i, val) {
      allSmiles += i;
    });
    var data = [{
        'lang': TRANSLATION.lang,
        'name': 'name',
        'from': 'from',
        'question': 'this is a simple test' + allSmiles,
        'approve': true,
        'id': 1,
        'timestamp': function () {
          return new Date();
        }()
    },{
        'lang': TRANSLATION.lang,
        'name': 'name',
        'from': 'from',
        'question': 'test',
        'approve': false,
        'id': 1,
        'timestamp': function () {
          return new Date();
        }()
    }];
    callback(data);
  };
  shouldUpdate = function(callback){
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
    label = conf().host;
  }

  return label;
}

function userCount(callback) {
  keys(KEY_USER("*"), function(users) {
    callback(users.KEYS.length);
  });
}

function addQuestion(label, name, from, question) {
  incr(KEY_QUESTIONS_COUNT(), function(id) {
    get_timestamp(function(time_now) {
      get_key(KEY_AUTO_APPROVE(), function(auto_approve) {
        var approve = false;
        if (auto_approve == "true") {
          approve = true;
        }
        var q = {
          'lang': TRANSLATION.lang,
          'name': name,
          'from': from,
          'question': question,
          'approve': approve,
          'id': (typeof(label) == 'string' && label != '') ? KEY_QUESTION_CUSTOM_LABEL(id, label) : KEY_QUESTION(id),
          'timestamp': time_now
        }
        setQuestion(q, label);
      });
    });
  });
}

function setQuestion(q, label) {
  set_key(q.id, $.param(q));
  if (notEmptyString(label)) {
    incr(KEY_SHOULD_UPDATE_LABEL(label), function(data) {});
  } else {
    incr(KEY_SHOULD_UPDATE(), function(data) {});
  }
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

function startIntervals() {    
  // Updates questions list.
  setInterval(function () {
    shouldUpdate(function(should_update) {
      if (should_update) {
        getQuestions(PLUGINS.setHtmlAllQuestions);
      }
    });
  }, conf().interval);

  // Loads new version of chat (new code) if needed.
  setInterval(function() {
    get_key(KEY_RESTART(), function(res) {
      if (res == 'true') {
        location.reload();
      }
    });
  }, conf().reload_interval);
}


$(document).ready(function() {
  initLang();
  initUserCss();
  initCommon();
  if(ISADMIN) {
    initAdminPage();
  } else {
    initUserPage();
  }
  startIntervals();
});


function initCommon() {
  if (getParameter('auto_approve') == 'true') {
    set_key(KEY_AUTO_APPROVE(), true);
  }
  if (getParameter('static_form') == 'true') {
    $("#askForm").show();
    $("#askBtn").hide();
    $("#helpBtn").hide();
  }
}


function initUserPage() {
  PLUGINS.setLang();
  updateUser();
  $('.btn').button();  //use jquery UI buttons
  $('.btn span').each(function() {
    $(this).addClass('comment').html(PLUGINS.emoticons($(this).html()));
  });
  if(!ISADMIN) {
    PLUGINS.initAskButtonAndForm($('#askBtn'), $("#askForm"));
    PLUGINS.initHelpBtn($('#helpBtn'));
    getQuestions(PLUGINS.setHtmlAllQuestions);
  }
};

function initLang () {
  var lang = getParameter('lang');
  TRANSLATION.lang = (lang != null && lang in TRANSLATION) ? lang: TRANSLATION.lang; 
}

function initUserCss() {
  var css_url = getParameter('css');
  if (css_url != null) {
    $('head').append('<link rel="stylesheet" href="' + css_url + '" type="text/css" />');
  }
}

