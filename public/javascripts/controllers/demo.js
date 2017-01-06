define([
  'controllers/phone',
  'jquery',
  'bootstrap'
  ], function(PhoneController, jQuery) {

  var DemoController = function($scope, $http, $window, $timeout, $controller) {
    angular.extend(this, $controller(PhoneController, {$scope: $scope}));
    var console = window.console;

    function intercept(method) {
      var original = console[method];
      console[method] = function(){

        if (original.apply){
          // Firefox/Chrome
          jQuery('#console').append(arguments[0].replace(/%c/g, '') + '<br>');
          original.apply(console, arguments);
        }else{
          // IE
          var message = Array.prototype.slice.apply(arguments).join(' ');
          original(message);
        }

        var elem = document.getElementById('console');

        if (elem)
          elem.scrollTop = elem.scrollHeight;

      };
    }

    var methods = ['log', 'warn', 'error'];
    for (var i = 0; i < methods.length; i++)
      intercept(methods[i]);
  };
  DemoController.$inject = ['$scope', '$http', '$window', '$timeout', '$controller'];

  return DemoController;
});
