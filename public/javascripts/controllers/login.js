define(['jquery'], function (jQuery) {

  var LoginController = function ($scope, $http, $window, $timeout) {
    $scope.master = {};

    $scope.update = function (login) {
      $scope.master = angular.copy(login);
    };

    $scope.reset = function (form) {
      if (form) {
        form.$setPristine();
        form.$setUntouched();
      }
      $scope.login = angular.copy($scope.master);
    };

    $scope.reset();
    $scope.login.processForm = function () {

      var req = {
        method: 'POST',
        url: '/account/login',
        headers: {
          'Content-Type': 'application/json; charset=utf-8'
        },
        data: {
          email: $scope.login.uemail.toLowerCase(),
          password: $scope.login.upassword
        }
      };
      $http(req)
        .then(function successCallback(response) {
          $window.location.href = response.data.redirect;
        }, function errorCallback(response) {
          jQuery(".alert").addClass('hidden');
          if (response && response.status == 403)
            jQuery("#alert-unverified").removeClass('hidden');
          else
            jQuery("#alert-user-pass").removeClass('hidden');
        });
    };
  };
  LoginController.$inject = ['$scope', '$http', '$window', '$timeout'];

  return LoginController;
});
