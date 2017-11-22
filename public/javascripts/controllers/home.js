define(['angular', 'jquery'], function (angular, $) {
  var HomeController = function ($scope, $http, $window) {
    $('#eolModal').modal('show');
  };

  var clearContactForm = function () {
    $('#newsletterForm .form-group #uname').val('');
    $('#newsletterForm .form-group #uemail').val('');
  };

  var checkName = function (element) {
    if (element.val().trim().length === 0) {
      $('.error-msg.name-invalid').removeClass('hidden');
      element.addClass('has-error');
      return false;
    } else {
      $('.error-msg.name-invalid').addClass('hidden');
      element.removeClass('has-error');
      return true;
    }
  };

  var checkEmail = function (element) {
    var email = element.val();

    // Check e-mail address syntax
    // Source: http://www.w3resource.com/javascript/form/email-validation.php
    if (/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(email)) {
      $('.error-msg.email-invalid').addClass('hidden');
      element.removeClass('has-error');
      return true;
    } else {
      $('.error-msg.email-invalid').removeClass('hidden');
      element.addClass('has-error');
      return false;
    }
  };

  $('#newsletterSignUp').click(function () {

    var emailElement = $('#newsletterForm .form-group #uemail');
    var nameElement = $('#newsletterForm .form-group #uname');

    if (checkName(nameElement) & checkEmail(emailElement)) {
      var url = "https://click2vox.com/api/contact/";
      var data = { email: emailElement.val(), name: nameElement.val(), reference: 'did2webrtc-page' };

      var jqxhr = $.post(url, data, function(status, code) {
        $('#newsletterModal #subscription-message').html('Thanks for subscribing!');
        $('#newsletterModal').modal('show');
      })
        .done(function() {
          clearContactForm();
        })
        .fail(function(xhr) {
          $('#newsletterModal #subscription-message').html(xhr.responseJSON.message);
          $('#newsletterModal').modal('show');
      });
    }

    return false;
  });

  HomeController.$inject = ['$scope', '$http', '$window'];

  return HomeController;
});
