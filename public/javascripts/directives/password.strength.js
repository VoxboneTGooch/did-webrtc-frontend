define(function () {
  var passwordStrengthDirective = function () {
    return {
      link: function (scope, elem, attrs, ctrl) {
        scope.$watch(attrs.passwordStrength, function (value) {
          if (angular.isDefined(value)) {
            elem.addClass('no-bottom-border-radius');

            if (value.length > 12) {
              scope.strength = 'strong';
              scope.strength_class = 'progress-bar-success';
              scope.strength_percent = 100;
            } else if (value.length > 8) {
              scope.strength = 'fair';
              scope.strength_class = 'progress-bar-warning';
              scope.strength_percent = 70;
            } else {
              scope.strength = 'weak';
              scope.strength_class = 'progress-bar-danger';
              scope.strength_percent = 40;
            }
          }
        });

        //- check min length when leave the field
        elem.on('blur', function () {
          if (elem.val().length < 8)
            scope.create_account.upassword.$setValidity('minlength', false);
        });

        //- let's set as true to be able to validate password strength
        elem.on('focus', function () {
          scope.create_account.upassword.$setValidity('minlength', true);
        });
      }
    };
  };

  return passwordStrengthDirective;
});
