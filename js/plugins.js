var PLUGINS = {};

PLUGINS.initAskForm = (function($btnObj, $formObj){
  $btnObj.on('click', function(){
    $btnObj.hide();
    $formObj.show();
  });
      
  $formObj.find('.sendBtn').on('click', function(){
    $formObj.hide();
    $('#askBtn').show();
    addQuestion($formObj.find('#name').val(), $formObj.find('#from').val(), $formObj.find('#message').val(), false);
    $formObj.find('#name').val('');
    $formObj.find('#from').val('');
    $formObj.find('#message').val('');
  });
      
  $formObj.find('.cancelBtn').on('click', function(){
    $formObj.hide();
    $('#askBtn').show();
    $formObj.find('#name').val('');
    $formObj.find('#from').val('');
    $formObj.find('#message').val('');
  });
});


PLUGINS.initAutoApproveBtn = (function($autoApproveBtn){
  var toggleAutoApproveBtn = function(autoApprove) {
    var auto = false;
    if (autoApprove == 'true') {
      auto = true;
    }
    return auto; 
  };

  // Initialize button color
  get_key(KEY_AUTO_APPROVE(), function(autoApprove) {
    var auto = toggleAutoApproveBtn(autoApprove);
    $autoApproveBtn.attr('checked', auto);
    $autoApproveBtn.button( "refresh" );
  });

  // Set toggle functionality
  $autoApproveBtn.on('click', function() {
    get_key(KEY_AUTO_APPROVE(), function(autoApprove) {
      set_key(KEY_AUTO_APPROVE(), !toggleAutoApproveBtn(autoApprove));
    });
  });
});


function padOneZero(num) {
  var ret = num.toString();
  if (num < 10) {
    ret = '0' + num;
  }
  return ret;
}

function timeFormat (date){
  var d = new Date(date*1000);
  var theString = d.getHours() + ':' + padOneZero(d.getMinutes()) + ':' + padOneZero(d.getSeconds());
  return theString;
}

PLUGINS.initExportBtn = (function($exportBtn){
  $exportBtn.on('click', function() {
    getQuestions(function(db) {
      var headers = ['lang', 'name', 'from', 'question', 'approve', 'id', 'timestamp']; 
      var output = headers.join('\t') + "<br>";
      for (var idx in db) {
        var question = db[idx];
        for (var jdx in headers) {
          alert(question[headers[jdx]]);
          if (headers[jdx] in question && question[headers[jdx]] != "") {
            if (headers[jdx] == "timestamp") {
              output += timeFormat(question[headers[jdx]]) + '\t';
            } else {
              output += question[headers[jdx]].toString() + '\t';
            }
          } else {
            output += "-\t";
          } 
        }
        output += '<br>';
      }
      $("#dialog").html(output);
      $("#dialog").dialog({ width:'auto' });
    });
  });
});


PLUGINS.setHtmlAllQuestions = (function(data){
  function setHtmlAllQuestions (db) {
    $('#questionsList').html('');
    for (var i = 0; i < db.length; i++) {
      if (ISADMIN) {
        setHtmlItemQAdmin(db[i], i);
      } else {
        setHtmlItemQ(db[i], i);    
      }
    };
  }
  setHtmlAllQuestions (data);

    function setHtmlItemQAdmin (q) {
      var item = $('<div>').addClass("itemQ").attr('data-approved', q.approve).attr('data-lang', q.lang).attr('data-id', q.id);
      var itemName = $('<span>').addClass('nameQ').html(q.name);
      var itemFrom = $('<span>').addClass('fromQ').html("@"+q.from);
      var itemTime = $('<span>').addClass('timeQ').html(timeFormat(q.timestamp));
      var itemMess = $('<div>').addClass('messageQ').html(PLUGINS.emoticons(q.question));
      var itemAdminAllow = $('<butto>').addClass('adminAllow btnSmall btnGreen').html(TRANSLATION[TRANSLATION.lang].allow);
      var itemAdminDisallow = $('<div>').addClass('adminDisallow btnSmall btnOrange').html(TRANSLATION[TRANSLATION.lang].disallow);
      var itemAdminRemove = $('<div>').addClass('adminRemove btnSmall btnRed').html(TRANSLATION[TRANSLATION.lang].removeBtn);

      var itemAdminButton = itemAdminDisallow;
      if (!q.approve) {
      itemAdminButton = itemAdminAllow;
      }

      var itemAdmin = $('<div>').addClass('btns toR').append(itemAdminButton).append(itemAdminRemove);

      item.append(itemAdmin).append(itemName).append(itemFrom).append(itemTime).append(itemMess);
      $('#questionsList').prepend(item);
    }

  function setHtmlItemQ (q) {
    if (q.approve) {
      var item = $('<div>').addClass("itemQ");
      var itemName = $('<span>').addClass('nameQ').html(q.name);
      var itemFrom = $('<span>').addClass('fromQ').html("@"+q.from);
      var itemTime = $('<span>').addClass('timeQ').html(timeFormat(q.timestamp));
      var itemMess = $('<div>').addClass('messageQ').html(PLUGINS.emoticons(q.question));

      item.append(itemName).append(itemFrom).append(itemTime).append(itemMess);
      $('#questionsList').prepend(item);
    }
  }
 
});


/*for translation use HTML attributes
data-tr="" data-tr-place-tag="" data-tr-place-attr=""
*
data-tr - parametr of TRANSLATION that have translatoin
data-tr-place-tag - html sector where must put translation 
data-tr-place-attr - - attrebute where must put translation
*/
PLUGINS.setLang = (function(lang){
    TRANSLATION.lang = lang || TRANSLATION.lang;
    var list = $('[data-tr]');
    list.each(function(i, el){
      $el = $(el);
      var transl = TRANSLATION[TRANSLATION.lang][$el.attr('data-tr')];
      var forTag = $el.attr("data-tr-place-tag");
      var forAttr = $el.attr('data-tr-place-attr');

      if (typeof forAttr !== 'undefined' && forAttr !== false) {
        $el.attr(forAttr, transl);
        return;
      } else if (typeof forTag !== 'undefined' && forTag !== false) {
        var testLength = $el.has(forTag);
        if (testLength.length !== 0 ) {
          $el.find(forTag).html(transl);
        } else {
          $el.html(transl);
        };
        return;
      } else {
        $el.html(transl);        
      }
    });
});

PLUGINS.emoticons =(function(text) {
  var url = "./images/icons/", patterns = [],
    metachars = /[[\]{}()*+?.\\|^$\-,&#\s]/g;

  // build a regex pattern for each defined property
  for (var i in EMOTIONS) {
    if (EMOTIONS.hasOwnProperty(i)){ // escape metacharacters
      patterns.push('('+i.replace(metachars, "\\$&")+')');
    }
  }

  // build the regular expression and replace
  return text.replace(new RegExp(patterns.join('|'),'g'), function (match) {
    if(typeof EMOTIONS[match] != 'undefined'){
      return '<i class="emoticon" style="background-position: ' + EMOTIONS[match] + '"></i>';
    } else {return match;}
  });
});

