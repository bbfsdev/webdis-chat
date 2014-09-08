var PLUGINS = {};

function emptyString(val) {
  return typeof(val) == 'string' && val == '';
}

PLUGINS.initAskButtonAndForm = (function($btnObj, $formObj){
  if (getParameter('static_form') != 'true') {
    $btnObj.on('click', function(){
      $btnObj.hide();
      $formObj.show();
    });

    $formObj.find('.sendBtn').on('click', function(){
      $formObj.hide();
      $btnObj.show();
    });

    $formObj.find('.cancelBtn').on('click', function(){
      $formObj.hide();
      $btnObj.show();
    });
  }

  PLUGINS.initAskForm($formObj);
});

PLUGINS.initAskForm = (function($formObj) {
  var from_text = getParameter('from_text');
  if (!emptyString(from_text)) {
    $formObj.find('#from').val(from_text);
  }
  var name_text = getParameter('name_text');
  if (!emptyString(name_text)) {
    $formObj.find('#name').val(name_text);
  }

  $formObj.find('.sendBtn').on('click', function(){
    if (getParameter('alert_on_empty_to') == 'true' && emptyString($formObj.find('#to').val())) {
      alert('To field is empty, please choose who to reply.');
      return;
    }
    if (emptyString($formObj.find('#message').val())) {
      alert('Message is empty, please write message');
      return;
    }
    addQuestion($formObj.find('#to').val(), $formObj.find('#name').val(), $formObj.find('#from').val(), $formObj.find('#message').val(), false);
    $formObj.find('#message').val('');
    if (getParameter('static_form') != 'true') {
      $formObj.find('#name').val('');
      $formObj.find('#from').val('');
    }
  });
      
  $formObj.find('.cancelBtn').on('click', function(){
    $formObj.find('#name').val('');
    $formObj.find('#from').val('');
    $formObj.find('#message').val('');
  });

  $('input, textarea').placeholder();
});

PLUGINS.initHelpBtn = (function($helpBtn) {
  $helpBtn.on('click', function() {
    var dialog_html = "";
    for (var emo in definition) {
      var title = definition[emo]['title'];
      var codes = definition[emo]['codes'];
      dialog_html += "<span class='helpSmilies'>" + codes[0] + "</span>:" + title + " " + codes + "<br>";
    }
    $("#helpDialog").html(dialog_html);
    $('.helpSmilies').each(function() {
      $(this).addClass('comment').html(PLUGINS.emoticons($(this).html()));
    });
    $("#helpDialog").dialog({ width:'auto' });
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

PLUGINS.initDeleteBtn = (function($deleteBtn) {
  $deleteBtn.on('click', function() {
    if (confirm("Are you sure?")) {
      deleteAllQuestions();
    }
  });
});

PLUGINS.initExportBtn = (function($exportBtn){
  $exportBtn.on('click', function() {
    getQuestions(function(db) {
      var headers = ['lang', 'name', 'from', 'question', 'approve', 'id', 'timestamp']; 
      var output = headers.join('\t') + "<br>";
      for (var idx in db) {
        var question = db[idx];
        for (var jdx in headers) {
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
  setHtmlAllQuestions(data);

  function setHtmlItemQAdmin (q) {
    var item = $('<div>').addClass("itemQ").attr('data-approved', q.approve).attr('data-lang', q.lang).attr('data-id', q.id);
    var itemName = $('<span>').addClass('nameQ').html(q.name);
    var itemFrom = $('<span>').addClass('fromQ').html("@"+q.from);
    var itemTime = $('<span>').addClass('timeQ').html(timeFormat(q.timestamp));
    var itemMess = $('<div>').addClass('messageQ').addClass('comment').html(PLUGINS.emoticons(q.question));
    var itemAdminAllow = $('<button>').addClass('adminAllow btnSmall btnGreen').html(TRANSLATION[TRANSLATION.lang].allow);
    var itemAdminDisallow = $('<div>').addClass('adminDisallow btnSmall btnOrange').html(TRANSLATION[TRANSLATION.lang].disallow);
    var itemAdminRemove = $('<div>').addClass('adminRemove btnSmall btnRed').html(TRANSLATION[TRANSLATION.lang].removeBtn);
    var itemAdminReply = $('<div>').addClass('adminReply btnSmall btnBlue').html(TRANSLATION[TRANSLATION.lang].replyBtn)

    var itemAdminButton = itemAdminDisallow;
    if (!q.approve) {
      itemAdminButton = itemAdminAllow;
    }

    var itemAdmin = $('<div>').addClass('btns toR').append(itemAdminButton).append(itemAdminRemove);
    if (getParameter('static_form') == 'true') {
      itemAdmin.append(itemAdminReply);
    }

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
      if (!transl) {
        transl = TRANSLATION[TRANSLATION.fallback_lang][$el.attr('data-tr')];
      }

      // Do nothing if no translation.
      if (typeof transl !== 'undefined') {
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
      }
    });
});

// Emocions support.
var definition = {smile:{title:"Smile",codes:[":)",":=)",":-)"]},"sad-smile":{title:"Sad Smile",codes:[":(",":=(",":-("]},"big-smile":{title:"Big Smile",codes:[":D",":=D",":-D",":d",":=d",":-d"]},cool:{title:"Cool",codes:["8)","8=)","8-)","B)","B=)","B-)","(cool)"]},wink:{title:"Wink",codes:[":o",":=o",":-o",":O",":=O",":-O"]},crying:{title:"Crying",codes:[";(",";-(",";=("]},sweating:{title:"Sweating",codes:["(sweat)","(:|"]},speechless:{title:"Speechless",codes:[":|",":=|",":-|"]},kiss:{title:"Kiss",codes:[":*",":=*",":-*"]},"tongue-out":{title:"Tongue Out",codes:[":P",":=P",":-P",":p",":=p",":-p"]},blush:{title:"Blush",codes:["(blush)",":$",":-$",":=$",':">']},wondering:{title:"Wondering",codes:[":^)"]},sleepy:{title:"Sleepy",codes:["|-)","I-)","I=)","(snooze)"]},dull:{title:"Dull",codes:["|(","|-(","|=("]},"in-love":{title:"In love",codes:["(inlove)"]},"evil-grin":{title:"Evil grin",codes:["]:)",">:)","(grin)"]},talking:{title:"Talking",codes:["(talk)"]},yawn:{title:"Yawn",codes:["(yawn)","|-()"]},puke:{title:"Puke",codes:["(puke)",":&",":-&",":=&"]},"doh!":{title:"Doh!",codes:["(doh)"]},angry:{title:"Angry",codes:[":@",":-@",":=@","x(","x-(","x=(","X(","X-(","X=("]},"it-wasnt-me":{title:"It wasn't me",codes:["(wasntme)"]},party:{title:"Party!!!",codes:["(party)"]},worried:{title:"Worried",codes:[":S",":-S",":=S",":s",":-s",":=s"]},mmm:{title:"Mmm...",codes:["(mm)"]},nerd:{title:"Nerd",codes:["8-|","B-|","8|","B|","8=|","B=|","(nerd)"]},"lips-sealed":{title:"Lips Sealed",codes:[":x",":-x",":X",":-X",":#",":-#",":=x",":=X",":=#"]},hi:{title:"Hi",codes:["(hi)"]},call:{title:"Call",codes:["(call)"]},devil:{title:"Devil",codes:["(devil)"]},angel:{title:"Angel",codes:["(angel)"]},envy:{title:"Envy",codes:["(envy)"]},wait:{title:"Wait",codes:["(wait)"]},bear:{title:"Bear",codes:["(bear)","(hug)"]},"make-up":{title:"Make-up",codes:["(makeup)","(kate)"]},"covered-laugh":{title:"Covered Laugh",codes:["(giggle)","(chuckle)"]},"clapping-hands":{title:"Clapping Hands",codes:["(clap)"]},thinking:{title:"Thinking",codes:["(think)",":?",":-?",":=?"]},bow:{title:"Bow",codes:["(bow)"]},rofl:{title:"Rolling on the floor laughing",codes:["(rofl)"]},whew:{title:"Whew",codes:["(whew)"]},happy:{title:"Happy",codes:["(happy)"]},smirking:{title:"Smirking",codes:["(smirk)"]},nodding:{title:"Nodding",codes:["(nod)"]},shaking:{title:"Shaking",codes:["(shake)"]},punch:{title:"Punch",codes:["(punch)"]},emo:{title:"Emo",codes:["(emo)"]},yes:{title:"Yes",codes:["(y)","(Y)","(ok)"]},no:{title:"No",codes:["(n)","(N)"]},handshake:{title:"Shaking Hands",codes:["(handshake)"]},skype:{title:"Skype",codes:["(skype)","(ss)"]},heart:{title:"Heart",codes:["(h)","<3","(H)","(l)","(L)"]},"broken-heart":{title:"Broken heart",codes:["(u)","(U)"]},mail:{title:"Mail",codes:["(e)","(m)"]},flower:{title:"Flower",codes:["(f)","(F)"]},rain:{title:"Rain",codes:["(rain)","(london)","(st)"]},sun:{title:"Sun",codes:["(sun)"]},time:{title:"Time",codes:["(o)","(O)","(time)"]},music:{title:"Music",codes:["(music)"]},movie:{title:"Movie",codes:["(~)","(film)","(movie)"]},phone:{title:"Phone",codes:["(mp)","(ph)"]},coffee:{title:"Coffee",codes:["(coffee)"]},pizza:{title:"Pizza",codes:["(pizza)","(pi)"]},cash:{title:"Cash",codes:["(cash)","(mo)","($)"]},muscle:{title:"Muscle",codes:["(muscle)","(flex)"]},cake:{title:"Cake",codes:["(^)","(cake)"]},beer:{title:"Beer",codes:["(beer)"]},drink:{title:"Drink",codes:["(d)","(D)"]},dance:{title:"Dance",codes:["(dance)","\\o/","\\:D/","\\:d/"]},ninja:{title:"Ninja",codes:["(ninja)"]},star:{title:"Star",codes:["(*)"]},mooning:{title:"Mooning",codes:["(mooning)"]},finger:{title:"Finger",codes:["(finger)"]},bandit:{title:"Bandit",codes:["(bandit)"]},drunk:{title:"Drunk",codes:["(drunk)"]},smoking:{title:"Smoking",codes:["(smoking)","(smoke)","(ci)"]},toivo:{title:"Toivo",codes:["(toivo)"]},rock:{title:"Rock",codes:["(rock)"]},headbang:{title:"Headbang",codes:["(headbang)","(banghead)"]},bug:{title:"Bug",codes:["(bug)"]},fubar:{title:"Fubar",codes:["(fubar)"]},poolparty:{title:"Poolparty",codes:["(poolparty)"]},swearing:{title:"Swearing",codes:["(swear)"]},tmi:{title:"TMI",codes:["(tmi)"]},heidy:{title:"Heidy",codes:["(heidy)"]},myspace:{title:"MySpace",codes:["(MySpace)"]},malthe:{title:"Malthe",codes:["(malthe)"]},tauri:{title:"Tauri",codes:["(tauri)"]},priidu:{title:"Priidu",codes:["(priidu)"]}};

PLUGINS.emoticons =(function(text) {
  $.emoticons.define(definition);
  return $.emoticons.replace(text);
});

