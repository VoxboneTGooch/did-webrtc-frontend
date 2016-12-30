define(['jquery'], function (jQuery) {

  var EditController = function ($scope, $http, $window, $timeout) {
    $scope.$watch('initData', function () {
      $scope.account = $scope.initData.account;
    });

    $scope.showAlert = function (type, message) {
      jQuery('#alert')
        .html(message)
        .addClass('alert-' + type)
        .css('display', 'block');
    };

    $scope.saveProfile = function (account) {
      console.log('Saving profile...');

      var req = {
        method: 'POST',
        url: '/account/edit',
        headers: {
          'Content-Type': 'application/json; charset=utf-8'
        },
        data: account
      };

      $http(req).then(
        function successCallback (response) {
          $scope.showAlert('success', 'Your profile has been saved succesfully');
        }, function errorCallback (response) {
          $scope.showAlert('danger', response.data.message);
        }
      );
    };
  };
  EditController.$inject = ['$scope', '$http', '$window', '$timeout'];

  return EditController;
});
