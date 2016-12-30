define(['jquery', 'bootstrap'], function(jQuery) {

  var EditSIPController = function($scope, $http, $window, $timeout) {

    $scope.savedSuccessfully = false;
    $scope.saveButtonText = 'Save Changes';
    $scope.showInteralSip = true;
    $scope.inputType = 'password';
    $scope.errorMsg = '';
    var storedBrowserUsername;

    $scope.user = {};
    $scope.wirePlugins = function() {
      jQuery('[data-toggle="tooltip"]').tooltip();
    };

    var reqHeaders = {
      'Content-Type': 'application/json; charset=utf-8'
    };

    var get_req = {
      method: 'GET',
      url: '/api/userInfo',
      headers: reqHeaders
    };

    var reqEditUser = function (user) {
      return {
        method: 'PUT',
        url: '/api/editUser',
        headers: reqHeaders,
        data: user
      };
    };

    var reqCreateUser = function (apiBrowserUsername) {
      return {
        method: 'POST',
        url: '/api/createUser',
        headers: reqHeaders,
        data: { 'apiBrowserUsername' : apiBrowserUsername }
      };
    };

    var reqDeleteUser = function (apiBrowserUsername) {
      return {
        method: 'DELETE',
        url: '/api/deleteUser',
        headers: reqHeaders,
        data: { 'apiBrowserUsername' : apiBrowserUsername }
      };
    };

    $http(get_req)
      .then(function successCallback (response) {
        $scope.user = JSON.parse(response.data);
        fillAllowedIps($scope.user.allowedIPs);
        storedBrowserUsername = $scope.user.browserUsername;

        if ($scope.user.registrarURI)
          $scope.registrar_enabled = true;
        else
          $scope.registrar_enabled = false;

      }, function errorCallback (response) {

      });

    function clearSettings (registrarEnabled) {

      if (!registrarEnabled) {
        $scope.user.sipUsername = null;
        $scope.user.sipPassword = null;
        $scope.user.registrarURI = null;
      }

    }

    function invalidIPaddresses(ipaddresses) {
      var invalids = 0;

      if (!ipaddresses) return invalids;

      var ipformat = /((^\s*((([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5]))\s*$)|(^\s*((([0-9A-Fa-f]{1,4}:){7}([0-9A-Fa-f]{1,4}|:))|(([0-9A-Fa-f]{1,4}:){6}(:[0-9A-Fa-f]{1,4}|((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9A-Fa-f]{1,4}:){5}(((:[0-9A-Fa-f]{1,4}){1,2})|:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9A-Fa-f]{1,4}:){4}(((:[0-9A-Fa-f]{1,4}){1,3})|((:[0-9A-Fa-f]{1,4})?:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){3}(((:[0-9A-Fa-f]{1,4}){1,4})|((:[0-9A-Fa-f]{1,4}){0,2}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){2}(((:[0-9A-Fa-f]{1,4}){1,5})|((:[0-9A-Fa-f]{1,4}){0,3}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){1}(((:[0-9A-Fa-f]{1,4}){1,6})|((:[0-9A-Fa-f]{1,4}){0,4}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(:(((:[0-9A-Fa-f]{1,4}){1,7})|((:[0-9A-Fa-f]{1,4}){0,5}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:)))(%.+)?\s*$))/;
      $scope.errorMsg = '';

      ipaddresses.forEach(function(ipaddress) {

        if (!ipformat.test(ipaddress)) {
          $scope.errorMsg += (ipaddress + ', ');
          invalids ++;
        }

      });

      if (invalids > 1)
        $scope.errorMsg += 'are invalid IP addresses';
      else if (invalids === 1)
        $scope.errorMsg += 'is an invalid IP address';

      return invalids;
    }

    function getAllowedIpsArray() {
      var arrIPs = [];
      jQuery('#allowed-ips > .allowed-ip > input').each(function(){

        if (jQuery(this).val())
          arrIPs.push(jQuery(this).val());

      });

      if (arrIPs.length)
        return arrIPs;
      else
        return null;

    }

    function fillAllowedIps(arrIPs) {

      if (arrIPs && arrIPs.length) {
        jQuery("#allowed-ips").children().last().remove();
        arrIPs.forEach(function(IP) {
          jQuery.get("/html/allowed-ip.html", function (data) {
            jQuery("#allowed-ips")
              .append(data)
              .append(function() {
                jQuery("#allowed-ips").children().last().find("input").val(IP);
              });
          });
        });
      }

    }

    jQuery("#allowed-ips").on('click', ".add-ip", function() {
      var selector = jQuery(this);
      var ipaddress = jQuery("#allowed-ips").children().last().find("input").val();

      if (ipaddress && jQuery("#allowed-ips").children().length < 5) {
          jQuery.get("/html/allowed-ip.html", function (data) {
            selector.parent().after(data);
          });
      }

    });

    jQuery("#allowed-ips").on('click', ".remove-ip", function() {

      if (jQuery("#allowed-ips").children().length === 1)
        jQuery("#allowed-ips").children().find("input").val('');
      else if (jQuery("#allowed-ips").children().length > 1)
        jQuery(this).parent().remove();

    });

    $scope.filterRegistrarUri = function (input) {
      var at_index = input.indexOf('@');
      var registrarURI = input.substring(at_index + 1);
      var sip_index = registrarURI.indexOf('sip:') + 3;
      var port_index = registrarURI.search(/(?:[^sip]):\d+/);
      var reg_uri;

      if (sip_index > 2)
        reg_uri = 'sip:' + registrarURI.substring(sip_index + 1).trim();
      else
        reg_uri = 'sip:' + registrarURI.trim();

      if (port_index > 0)
        return reg_uri;
      else
        return reg_uri + ":5060";

    };

    $scope.showPassword = function() {
      $scope.inputType = $scope.inputType === 'password' ? 'text' : 'password';
    };

    $scope.saveConfig = function() {
      $scope.savedSuccessfully = false;
      $scope.errorMsg = '';
      $scope.user.allowedIPs = getAllowedIpsArray();
      clearSettings($scope.registrar_enabled);

      if (!invalidIPaddresses($scope.user.allowedIPs)) {

        if ($scope.user.registrarURI)
          $scope.user.registrarURI = $scope.filterRegistrarUri($scope.user.registrarURI);

        if ($scope.user.sipUsername && (storedBrowserUsername !== $scope.user.sipUsername)) {
          /*if the user changed his sipusername, we must create a new
          user in the api, since its required that browserUsername and
          sipUsername must be the same*/
          storedBrowserUsername = $scope.user.browserUsername;
          $scope.user.browserUsername = $scope.user.sipUsername;
          $http(reqCreateUser($scope.user.sipUsername))
            .then(function successCallback (response) {
              var newUserId = response.data;

              if (newUserId)
                $scope.user.id = newUserId;

              $http(reqEditUser($scope.user))
                .then(function successCallback (response) {
                  $http(reqDeleteUser(storedBrowserUsername))
                    .then(function successCallback (response) {
                      storedBrowserUsername = $scope.user.browserUsername;
                      $scope.savedSuccessfully = true;
                    }, function errorCallback (response) {
                      storedBrowserUsername = $scope.user.browserUsername;
                      $scope.savedSuccessfully = true;
                    });
                }, function errorCallback (response) {
                  $scope.errorMsg = 'There was an error editing your account';
                  $scope.savedSuccessfully = false;
                });
            }, function errorCallback (response) {
              $scope.errorMsg = 'There was an error generating your registrar config';
              $scope.savedSuccessfully = false;
            });
        } else {
          //if the sipusername is the same, we only update it
          $http(reqEditUser($scope.user))
            .then(function successCallback (response) {
              $scope.savedSuccessfully = true;
            }, function errorCallback (response) {
              $scope.errorMsg = 'There was an error editing your account';
            });
        }

      }

    };
  };
  EditSIPController.$inject = ['$scope', '$http', '$window', '$timeout'];

  return EditSIPController;
});
