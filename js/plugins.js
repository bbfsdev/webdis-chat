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
      setHtmlItemQ(db[i], i);
    };
  }
  setHtmlAllQuestions (data);

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
PLUGINS.setLang = (function(lang){
    TRANSLATION.lang = lang || TRANSLATION.lang;
    $('body').attr('dir', TRANSLATION[TRANSLATION.lang].dir)
    $('#name').attr('placeholder', TRANSLATION[TRANSLATION.lang].name)
    $('#from').attr('placeholder', TRANSLATION[TRANSLATION.lang].from)
    $('#message').attr('placeholder', TRANSLATION[TRANSLATION.lang].message)
    $('#askBtn').html(TRANSLATION[TRANSLATION.lang].ask);
    $('#exportBtn').html(TRANSLATION[TRANSLATION.lang].export);
    $('.sendBtn').html(TRANSLATION[TRANSLATION.lang].send);
    $('.cancelBtn').html(TRANSLATION[TRANSLATION.lang].cancel);
});