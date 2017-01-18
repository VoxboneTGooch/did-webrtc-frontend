define([
  'controllers/browserNotifications',
  'jquery',
  'bootstrap'
  ], function(BrowserNotificationsController, jQuery) {

  var EditNotificationsController = function($scope, $http, $window, $timeout, $controller) {
    angular.extend(this, $controller(BrowserNotificationsController, {$scope: $scope}));
    $scope.playing = false;
    $scope.savedSuccessfully = false;
    $scope.saveButtonText = 'Save Changes';

    var audio = document.createElement('audio');

    $scope.$watch('initData', function () {
      jQuery('[data-toggle="tooltip"]').tooltip();

      if ($scope.initData)
        $scope.account = $scope.initData.account;

    });

    var reqHeaders = {
      'Content-Type': 'application/json; charset=utf-8'
    };

    var reqAccount = function (account) {
      return {
        method: 'POST',
        url: '/account/edit',
        headers: reqHeaders,
        data: account
      };
    };

    $scope.play = function () {
      audio.src = '/audio/' + $scope.account.ringtone + '.ogg';

      if (!$scope.playing)
        audio.play();
      else
        audio.pause();

      audio.currentTime = 0;
      $scope.playing = !$scope.playing;
    };

    $scope.pause = function () {
      audio.pause();
      audio.currentTime = 0;
      $scope.playing = !$scope.playing;
    };

    $scope.saveNotifications = function () {
      $scope.savedSuccessfully = false;
      $scope.savingError = false;
      $scope.saveButtonText = 'Saving...';

      $http(reqAccount($scope.account))
        .then(function successCallback(response) {
          $scope.saveButtonText = 'Save Changes';
          $scope.savedSuccessfully = true;
        }, function errorCallback(response) {
          $scope.saveButtonText = 'Save Changes';
          $scope.savedSuccessfully = false;
        });
    };

  };
  EditNotificationsController.$inject = ['$scope', '$http', '$window', '$timeout', '$controller'];

  return EditNotificationsController;
});
