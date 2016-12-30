define(function () {
  var passwordCheckDirective = function ($timeout) {
    return {
      require: 'ngModel',
      link: function (scope, elem, attrs, ctrl) {
        var firstPassword = '#' + attrs.pwCheck;
        ctrl.$parsers.unshift(function (value) {
          var pwVerify = value === $(firstPassword).val();
          ctrl.$setValidity('pwmatch', pwVerify);
          return value;
        });
      }
    };
  };

  return passwordCheckDirective;
});