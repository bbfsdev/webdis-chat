var PLUGINS = {};
PLUGINS.initAskForm = (function($btnObj, $formObj){
  $btnObj.on('click', function(){
    $btnObj.hide();
    $formObj.show();
  });
      
  $formObj.find('.sendBtn').on('click', function(){
    formObj.hide();
    $('#askBtn').show();
    addQuestion($formObj.find('.name').val(), $formObj.find('.from').val(), $formObj.find('.message').val(), false);
    $formObj.find('.name').val('');
    $formObj.find('.from').val('');
    $formObj.find('.message').val('');
  });
      
  $formObj.find('.cancelBtn').on('click', function(){
    $formObj.find('.name').val('');
    $formObj.find('.from').val('');
    $formObj.find('.message').val('');
  });
});


PLUGINS.initExportBtn = (function($exportBtn){
    $exportBtn.on('click', function() {
      getQuestions(function(db) {
        var output = "";
        for (var idx in db) {
          output += db[idx].name + '@' + db[idx].location + ' ' + db[idx].question + '<br>';
        }
        $("#dialog").html(output);
        $("#dialog").dialog();
      });
    });

  }
);


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
      var itemTime = $('<span>').addClass('timeQ').html(timeFormate(q.timestamp));
      var itemMess = $('<div>').addClass('messageQ').html(q.question);
      var itemAdminAllow = $('<div>').addClass('adminAllow btn btnGreen').html(TRANSLATION[TRANSLATION.lang].allow);
      var itemAdminDisallow = $('<div>').addClass('adminDisallow btn btnOrange').html(TRANSLATION[TRANSLATION.lang].disallow);
      var itemAdminRemove = $('<div>').addClass('adminRemove btn btnRed').html(TRANSLATION[TRANSLATION.lang].remove);

      var itemAdminButton = itemAdminDisallow;
      if (!q.approve) {
      itemAdminButton = itemAdminAllow;
      }

      var itemAdmin = $('<div>').addClass('btns').append(itemAdminButton).append(itemAdminRemove);

      item.append(itemName).append(itemFrom).append(itemTime).append(itemMess).append(itemAdmin);
      $('#questionsList').prepend(item);
    }




  function setHtmlItemQ (q) {
    if (q.approve) {
      var item = $('<div>').addClass("itemQ");
      var itemName = $('<span>').addClass('nameQ').html(q.name);
      var itemFrom = $('<span>').addClass('fromQ').html("@"+q.from);
      var itemTime = $('<span>').addClass('timeQ').html(timeFormate(q.timestamp));
      var itemMess = $('<div>').addClass('messageQ').html(q.question);


      item.append(itemName).append(itemFrom).append(itemTime).append(itemMess);
      $('#questionsList').prepend(item);
    }

  }

  function timeFormate (date){
    var d = new Date(date);
    var month = (d.getMonth() < 9) ? '0'+(d.getMonth() + 1): d.getMonth() + 1;
    var theString = d.getDate() + '.' + month + '.' + d.getFullYear() + ' ' + d.getHours() + ':' + d.getMinutes() + ':' + d.getSeconds();
    return theString;
  }
});

//set translation of app
/*PLUGINS.setLang = (function(lang){
    TRANSLATION.lang = lang || TRANSLATION.lang;
    $('body').attr('dir', TRANSLATION[TRANSLATION.lang].dir)
    $('#name').attr('placeholder', TRANSLATION[TRANSLATION.lang].name)
    $('#from').attr('placeholder', TRANSLATION[TRANSLATION.lang].from)
    $('#message').attr('placeholder', TRANSLATION[TRANSLATION.lang].message)
    $('#askBtn').html(TRANSLATION[TRANSLATION.lang].ask);
    $('#exportBtn').html(TRANSLATION[TRANSLATION.lang].export);
    $('.sendBtn').html(TRANSLATION[TRANSLATION.lang].send);
    $('.cancelBtn').html(TRANSLATION[TRANSLATION.lang].cancel);
});*/

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

PLUGINS.afterAll = (function(fn){
  
  setTimeout(function () {
    setTimeout(function(){
      fn();  
    }, 0);  
  }, 0);
});
