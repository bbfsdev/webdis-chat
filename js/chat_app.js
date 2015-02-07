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
KEY_LAST_SEEN = function(username) { return ["chat", "last_seen", username].join("."); };



// Interface methods
var getQuestions = function(callback) {
  getCustomQuestions(getLabel(), callback);
};

var getCustomQuestions = function(label, callback) {
  keys(KEY_QUESTION_CUSTOM_LABEL('*', label), function(keys) {
    if (keys.KEYS.length == 0) { 
      callback([]);
    } else {
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
    }
  });
}

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

var getUsername = function(user_id) {
  var from_text = getParameter('from_text');
  if (!notEmptyString(from_text)) {
    if (notEmptyString(user_id)) {
      from_text = 'unknown' + user_id;
    } else {
      from_text = '';
    }
  }
  return from_text;
}

var updateUser = function () {
  incr(KEY_USERS_COUNT(), function(user_id) {
    var setUserTimeout = function() {
      var from_text = getUsername(user_id.toString());
      set_key(KEY_USER(user_id), from_text, function() {}, conf().user_count_timeout + 2);
    };
    setInterval(setUserTimeout, conf().user_count_timeout * 1000);
    setUserTimeout();
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
var IS_USER_LIST = false;
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
    label = location.host;
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

function loadNewVersionInterval() {
  // Loads new version of chat (new code) if needed.
  setInterval(function() {
    get_key(KEY_RESTART(), function(res) {
      if (res == 'true') {
        location.reload();
      }
    });
  }, conf().reload_interval);
}

var getLabelFromQuestionId = function(question_id) {
  return question_id.match(/chat.(.*).question.[0-9]+/)[1];
};

var updateSeenQuestions = function(last_question) {
  hset(KEY_LAST_SEEN(getUsername()), getLabelFromQuestionId(last_question.id), last_question.timestamp);
};

var getLastSeen = function(callback) {
  hget_all(KEY_LAST_SEEN(getUsername()), function(last_seen) {
    var ret = {};
    for (var idx in last_seen) {
      ret[idx] = parseInt(last_seen[idx]);
    }
    callback(ret);
  });
};

function startIntervals() {    
  // Updates questions list.
  setInterval(function () {
    shouldUpdate(function(should_update) {
      if (should_update) {
        getQuestions(function(questions) {
          PLUGINS.setHtmlAllQuestions(questions);
          if (questions && questions.length > 0) {
            updateSeenQuestions(questions[questions.length-1]);
          }
        });
      }
    });
  }, conf().interval);

  loadNewVersionInterval();
}


$(document).ready(function() {
  initLang();
  initUserCss();
  initCommon();
  if(ISADMIN) {
    initAdminPage();
    startIntervals();
  } else if (IS_USER_LIST) {
    initUserListPage(); 
    loadNewVersionInterval();
  } else {
    initUserPage();
    startIntervals();
  }
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

var getUsers = function(callback) {
  keys(KEY_USER("*"), function(keys) {
    mget(keys.KEYS, function(data) {
      var users = [];
      for (var idx in data.MGET) {
        if (data.MGET[idx] != null) {
          var username = data.MGET[idx];
          users.push(username);
        }
      }
      callback(users);
    });
  });
};

function initUserListPage() {
  PLUGINS.setLang();
  updatePrivateRoomPattern();
  var updateUserLink = function() {
    // Get static prams
    var link_pattern = getParameter('link_pattern');
    if (!notEmptyString(link_pattern)) {
      link_pattern = '//' + window.location.hostname + '?label=LABEL&auto_approve=true&from_text=' + getUsername();
    }

    // Get private rooms status
    updatePrivateRoomStatus(function (privateRoomsStatus) {
      console.log(privateRoomsStatus);
      getLastSeen(function (lastSeenStatus) {
        console.log(lastSeenStatus);

        // Get other users online
        getUsers(function(users) {
  
          // Update links to other users
          $("#users").empty();
          // Add each user only once.
          var usersHash = {};
          for (var idx in users) {
            var username = users[idx];
            if (username in usersHash) {
              continue;
            }
            if (username && username != "null") {
              if (link_pattern && username != getUsername()) {
                var link_label = privateRoomLabel(getLabel(), [username, getUsername()]);
                var link = link_pattern.replace('LABEL', link_label);
                var last_seen_timestamp = 0;
                if (link_label in lastSeenStatus) {
                  last_seen_timestamp = parseInt(lastSeenStatus[link_label]);
                }
                var private_room_status_timestamp = 0;
                if (link_label in privateRoomsStatus) {
                  private_room_status_timestamp = parseInt(privateRoomsStatus[link_label]);
                }
                var messageDiv = $("#users").append("<div><a target=\"_blank\" href='" + link + "'>" + username + "</a></div>")
                  .children().last().addClass("noNewMessage");
                if (private_room_status_timestamp > last_seen_timestamp) {
                  messageDiv.removeClass("noNewMessage").addClass("newMessage");
                  messageDiv.fadeOut(700).fadeIn(700);
                }
              } else {
                $("#users").append("<div>" + username + "</div>").addClass("noNewMessage");
              }
            }
            usersHash[username] = true;
          }
        }); // getUsers
      }); // getLastSeen
    }); // updatePrivateRoomStatus
  };
  setInterval(updateUserLink, conf().interval);
  updateUserLink();
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

var private_room_label_pattern = 'L_X_Y';
var updatePrivateRoomPattern = function() {
  var param = getParameter('private_room_label_pattern');
  if (notEmptyString(param)) {
    private_room_label_pattern = param;
  }
}

var extractUsername = function(id) {
  var r = new RegExp(privateRoomLabel(getLabel(), ['(.*)', getUsername()], false));
  var matched = id.match(r);
  if (matched) {
    return matched[0];
  }
  r = new RegExp(privateRoomLabel(getLabel(), [getUsername(), '(.*)'], false));
  var matched = id.match(r);
  return matched[0];
}

var updatePrivateRoomStatus = function(callback) {
  getPrivateRoomQuestions(function(data) {
    var privateRoomsStatus = {};
    for (var idx in data) {
      var q = data[idx];
      privateRoomsStatus[getLabelFromQuestionId(q.id)] = q.timestamp;
    }
    callback(privateRoomsStatus);
  });
}

var privateRoomLabel = function(label, usernames, sort) {
  sort = typeof sort !== 'undefined' ? sort : true;
  if (sort) {
    usernames.sort();
  }
  return private_room_label_pattern
        .replace('L', label)
        .replace('X', usernames[0])
        .replace('Y', usernames[1]);
}

var getPrivateRoomQuestions = function(callback) {
  getCustomQuestions(privateRoomLabel(getLabel(), ['*', getUsername()], false), function(questions) {
    getCustomQuestions(privateRoomLabel(getLabel(), [getUsername(), '*'], false), function(more_questions) {
        callback(questions.concat(more_questions));
    });
  });
};
