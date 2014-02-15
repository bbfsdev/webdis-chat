// Include app.js for this to work

// All application keys
KEY_USERS_COUNT = function() { return ["chat", getLabel(), "users", "count"].join(".") ; };
KEY_USER = function(user_id) { return ["chat", getLabel(), "user", user_id].join(".") ; };
KEY_SHOULD_UPDATE = function() { return ["chat", getLabel(), "should_update"].join(".") ; };
KEY_QUESTIONS_COUNT = function() { return ["chat", getLabel(), "questions", "count"].join(".") ; };
KEY_QUESTION = function(question_id) { return ["chat", getLabel(), "question", question_id].join(".") ; };
KEY_RESTART = function() { return ["chat", getLabel(), "restart"].join("."); };

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

function updateUser() {
  incr(KEY_USERS_COUNT(), function(user_id) {
    setInterval(function() {
      set_key(KEY_USER(user_id), "live", function() {}, conf.user_count_timeout);
    }, conf.user_count_timeout * 1000);
  });
}

function userCount(callback) {
  keys(KEY_USER("*"), function(users) {
    callback(users.KEYS.length);
  });
}

var latest_question = "";
function sholdUpdate(callback) {
  get_key(KEY_SHOULD_UPDATE(), function(res) {
    if (latest_question != res) {
      latest_question = res;
      callback(true);
    } else {
      callback(false);
    }
  });
}

function addQuestion(lang, name, from, question) {
  incr(KEY_QUESTIONS_COUNT(), function(id) {
    get_timestamp(function(time_now) {
      var q = {
        'lang': lang,
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

function getQuestions(callback) {
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

function testInterface() {
  alert(TEST_DB.join("\n"));
  addQuestion('a', 'b', 'c', 'd');
  alert(TEST_DB.join("\n"));
  toggleQuestion('a', 'b', 'c', 'd', true);
  alert(TEST_DB.join("\n"));
  deleteQuestion('a', 'b', 'c', 'd');
  alert(TEST_DB.join("\n"));
}

function setHtmlAllQuestions (db) {
  $('#questionsList').html('');
  for (var i = 0; i < db.length; i++) {
    setHtmlItemQ(db[i], i);
  };
}

function setHtmlItemQ (q) {
  if (q.approve) {
    var item = $('<div>').addClass("itemQ");
    var itemName = $('<span>').addClass('nameQ').html(q.name);
    var itemFrom = $('<span>').addClass('fromQ').html("@"+q.from);
    var itemMess = $('<div>').addClass('messageQ').html(q.question);

    item.append(itemName).append(itemFrom).append(itemMess);
    $('#questionsList').prepend(item);
  }
}

function updateLang(lang){
  TRANSLATION.lang = lang || TRANSLATION.lang;
  $('body').attr('dir', TRANSLATION[TRANSLATION.lang].dir)
  $('#name').attr('placeholder', TRANSLATION[TRANSLATION.lang].name)
  $('#from').attr('placeholder', TRANSLATION[TRANSLATION.lang].from)
  $('#message').attr('placeholder', TRANSLATION[TRANSLATION.lang].message)
  $('#askBtn').html(TRANSLATION[TRANSLATION.lang].ask);
  $('#exportBtn').html(TRANSLATION[TRANSLATION.lang].export);
  $('.sendBtn').html(TRANSLATION[TRANSLATION.lang].send);
  $('.cancelBtn').html(TRANSLATION[TRANSLATION.lang].cancel);
}

$(document).ready(function () {
  updateLang();

  $("[name='lang']").on('change', function() {
    updateLang($('#langSwitch input:checked').val());
  });

  $('#askBtn').on('click', function(){
    $(this).hide();
    $("#askForm").show();
  });
      
  $('.sendBtn').on('click', function(){
    $('#askForm').hide();
    $('#askBtn').show();
    addQuestion("es", $('#name').val(), $('#from').val(), $('#message').val(), false); //where i can take Language ???
    $('#name').val('');
    $('#from').val('');
    $('#message').val('');
  });
      
  $('.cancelBtn').on('click', function(){
    $('#name').val('');
    $('#from').val('');
    $('#message').val('');
  });

  $('#exportBtn').on('click', function() {
    getQuestions(function(db) {
      var output = "";
      for (var idx in db) {
        output += db[idx].name + '@' + db[idx].location + ' ' + db[idx].question + '<br>';
      }
      $("#dialog").html(output);
      $("#dialog").dialog();
    });
  });

  getQuestions(setHtmlAllQuestions);
  setInterval(function () {
    sholdUpdate(function(should_update) {
      if (should_update) {
        getQuestions(setHtmlAllQuestions);
      }
    });
  }, conf.interval);

  setInterval(function() {
    get_key(KEY_RESTART(), function(res) {
      debug = $.url('?debug');
      if (res == 'true') {
        location.reload();
      }
    });
  }, conf.reload_interval);

  updateUser();
});
