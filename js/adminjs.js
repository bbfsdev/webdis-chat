ISADMIN = true;


    $(document).ready(function () {
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

      userCount(function(count) {
        $('#count').text(count);
      });
      setInterval(function() {
        userCount(function(count) {
          $('#count').text(count);
        });
      }, conf.refresh_count);
    });