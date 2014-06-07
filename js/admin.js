ISADMIN = true;


/*function startIntervals() {    
 setInterval(function() {
    userCount(function(count) {
      $('#count').text(count);
    });
  }, conf.refresh_count);
}*/

function initAdminPage() {
  PLUGINS.setLang();
  updateUser();
  $('.btn').button();//use jquery UI buttons

  PLUGINS.initAutoApproveBtn($('#autoApproveBtn'));
  PLUGINS.initDeleteBtn($('#deleteBtn'));
  PLUGINS.initExportBtn($('#exportBtn'));
  getQuestions(PLUGINS.setHtmlAllQuestions);
  bindAdminEvents();
  userCount(function(count) {
    $('#count').text(count);
  });
 
};

function bindAdminEvents() {
 $('#questionsList').on('click', '.adminRemove', function () {
    var item = $(this).parents('.itemQ');
    deleteQuestion(item.attr('data-id'));
  });
  $('#questionsList').on('click', ".adminAllow", function () {
    var item = $(this).parents('.itemQ');
    toggleQuestion( item.attr('data-id'), true );
  });
  $('#questionsList').on('click', ".adminDisallow", function () {
    var item = $(this).parents('.itemQ');
    toggleQuestion( item.attr('data-id'), false);    
  });
}
