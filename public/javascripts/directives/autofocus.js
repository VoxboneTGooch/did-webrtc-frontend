define(function () {
  var autoFocusDirective = function ($timeout) {
    return {
      restrict: 'AC',
      link: function (_scope, element) {
        $timeout(function () {
          element[0].focus();
        }, 0);
      }
    };
  };

  return autoFocusDirective;
});
