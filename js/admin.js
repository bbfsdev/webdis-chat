ISADMIN = true;

function initAdminPage() {
  PLUGINS.setLang();
  updateUser();
  $('.btn').button();  //use jquery UI buttons

  PLUGINS.initAutoApproveBtn($('#autoApproveBtn'));
  PLUGINS.initDeleteBtn($('#deleteBtn'));
  PLUGINS.initExportBtn($('#exportBtn'));
  PLUGINS.initAskForm($("#askForm"));
  getQuestions(PLUGINS.setHtmlAllQuestions);
  bindAdminEvents();
  var updateUserCount = function() {
    userCount(function(count) {
      $('#count').text(count);
    });
  };
  setInterval(updateUserCount, conf().refresh_count);
  updateUserCount();
};

function bindAdminEvents() {
 $('#questionsList').on('click', '.adminRemove', function () {
    var item = $(this).parents('.itemQ');
    deleteQuestion(item.attr('data-id'));
  });
  $('#questionsList').on('click', ".adminAllow", function () {
    var item = $(this).parents('.itemQ');
    toggleQuestion(item.attr('data-id'), true);
  });
  $('#questionsList').on('click', ".adminDisallow", function () {
    var item = $(this).parents('.itemQ');
    toggleQuestion(item.attr('data-id'), false);    
  });
  $('#questionsList').on('click', ".adminReply", function () {
    var item = $(this).parents('.itemQ');
    $('#to').val(item.data('id').split('.').slice(1, -2).join('.'));
  });
}
