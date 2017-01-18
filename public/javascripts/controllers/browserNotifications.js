define(['jquery', 'bootstrap'], function(jQuery) {

  var BrowserNotificationsController = function($scope, $http, $window, $timeout) {
    if (!Notification) {
      alert('Desktop notifications not available in your browser. Try Chromium.');
    }

    if (Notification.permission !== "granted")
      Notification.requestPermission();

    $scope.showNotificationStatus = function () {
      if ($scope.account.browserNotifications)
        $scope.showNotification("Notifications enabled");
      else
        $scope.showNotification("Notifications are now disabled");
    };

    $scope.showNotification = function(message) {

      if (Notification.permission !== "granted")
        Notification.requestPermission();
      else {
        var notification = new Notification('did2webr.tc', {
          icon: '/images/favicon.ico',
          body: message,
        });
        notification.onclick = function () {
          window.focus();
        };
      }

    };

  };
  BrowserNotificationsController.$inject = ['$scope', '$http', '$window', '$timeout'];

  return BrowserNotificationsController;
});
