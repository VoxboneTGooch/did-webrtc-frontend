define([
  'controllers/browserNotifications',
  'jquery',
  'bootstrap'
  ], function(BrowserNotificationsController, jQuery) {

  var PhoneController = function($scope, $http, $window, $timeout, $controller) {
    angular.extend(this, $controller(BrowserNotificationsController, {$scope: $scope}));
    $scope.callState = 'initial';
    $scope.phoneImg = '/images/vox-static-phone.png';
    var audio;
    var constraints = {
      video: false,
      audio: true,
    };
    navigator.getUserMedia = navigator.getUserMedia || navigator.mozGetUserMedia || navigator.webkitGetUserMedia;

    if (navigator.getUserMedia) {
      navigator.getUserMedia(constraints, function() {
        appendMessage('ok', 'Microphone access granted');
      }, function(){
        appendMessage('remove', 'Could not access microphone');
      });
    } else {
      appendMessage('remove', 'Your browser does not support accessing your microphone, please try again in either Chrome, Firefox or Opera');
    }

    appendMessage('time', 'Waiting for Registration');

    function appendMessage(icon, message) {

      if (jQuery("#status-message-list").size() > 0) {
        jQuery("#status-message-list").children().last().addClass('disabled');
        jQuery("#status-message-list")
        .append('<div class="call-info">\
                  <span class="glyphicon glyphicon-' + icon + '"></span>\
                   ' + message + '\
                </div>');
        var elem = document.getElementById('status-message-list');

        if (elem)
          elem.scrollTop = elem.scrollHeight;

      }
    }

    var reqHeaders = {
      'Content-Type': 'application/json; charset=utf-8'
    };

    var get_req = {
      method: 'GET',
      url: '/api/userInfo',
      headers: reqHeaders
    };

    function setState(state, callee) {

      switch (state) {
        case 'waiting':
          $scope.callState = 'waiting';
          $scope.phoneImg = '/images/vox-static-phone.png';
          break;
        case 'receiving':

          if ($scope.browserNotifications)
            $scope.showNotification("Incoming Call. Click to see the phone");

          appendMessage('bell', 'Receiving call');
          $scope.callState = 'receiving';
          $scope.phoneImg = '/images/vox-ringing-phone.gif';
          //$scope.callMsg = "Incoming call from " + callee;
          break;
        case 'ongoing':
          //$scope.callMsg = "In call with " + callee;
          appendMessage('earphone', 'In Call');
          $scope.callState = 'ongoing';
          $scope.phoneImg = '/images/vox-hand-phone.png';
          break;
        default:
          alert("default");
      }

      if(!$scope.$$phase)
        $scope.$apply();

    }

    function clearDevice(device){
      jQuery('.img-container #' + device +' div').each(function(){
        jQuery(this).removeClass('active');
      });
    }

    function setMicDot(dot) {
      jQuery('#phone-microphone #mic' + dot).addClass('active');
    }

    function setEapDot(dot) {
      jQuery('#phone-earphone #eap' + dot).addClass('active');
    }

    function filterRegistrarURI (registrarURI) {

      if (!registrarURI)
        return null;

      var sipIndex = registrarURI.indexOf('sip:') + 4;
      var portIndex = registrarURI.search(/(?:[^sip]):\d+/) - 3;
      return registrarURI.substring(sipIndex).substring(0, portIndex).trim();
    }

    $scope.isCallOngoing = function() {
      return angular.equals($scope.callState, 'ongoing');
    };

    $scope.isCallReceiving = function() {
      return angular.equals($scope.callState, 'receiving');
    };

    $scope.getPhoneImage = function() {
      return $scope.phoneImg;
    };

    $scope.init = function (config, ringtone, email, browserNotifications) {
      var req_url;
      var now;

      if (browserNotifications)
        $scope.browserNotifications = JSON.parse(browserNotifications);

      if (config.apiBrowserName)
        req_url = '/api/userInfo?apiBrowserName=' + config.apiBrowserName;
      else
        req_url = '/api/userInfo';

      var get_req = {
        method: 'GET',
        url: req_url,
        headers: reqHeaders
      };

      $http(get_req)
      .then(function successCallback (response) {
        $scope.user = JSON.parse(response.data);
        $scope.registrar = filterRegistrarURI($scope.user.registrarURI);
        audio = new Audio('/audio/' + ringtone + '.ogg');
        voxbone.WebRTC.configuration.log_level = voxbone.Logger.log_level.INFO;
        voxbone.WebRTC.username = $scope.user.sipUsername;
        voxbone.WebRTC.password = $scope.user.sipPassword;
        voxbone.WebRTC.configuration.uri = 'sip:' + $scope.user.browserUsername + '@sip.2webr.tc';
        voxbone.WebRTC.configuration.ws_servers = ['wss://staging-sip.2webr.tc'];

        //exporting call logs
        voxbone.WebRTC.configuration.post_logs = true;
        now = new Date($.now());
        var call = {
           call: {
              'did2webr.tc_email': email,
              'did2webr.tc_apiBrowsername': $scope.user.browserUsername,
              'did2webr.tc_callTime': now
            }
        };

        voxbone.WebRTC.webrtcLogs += JSON.stringify(call);
        voxbone.WebRTC.basicAuthInit(config.vox_username, config.vox_password);

        voxbone.WebRTC.onCall = function (data, cb) {

          var callee = data.request.from.display_name;
          setState('receiving', callee);
          audio.play();

          $scope.answerCall = function () {
            cb(true);
            setState('ongoing', callee);
            audio.pause();
            audio.currentTime = 0;
          };

          $scope.declineCall = function () {
            cb(false);
          };

          voxbone.WebRTC.customEventHandler.failed = function(e) {
            appendMessage('phone-alt', 'Ended call');
            appendMessage('time', 'Waiting for incoming call');
            setState('waiting');
            audio.pause();
            audio.currentTime = 0;
          };

        };

        }, function errorCallback (response) {

        });

      voxbone.WebRTC.customEventHandler.ended = function(e) {
        appendMessage('phone-alt', 'Ended call');
        appendMessage('time', 'Waiting for incoming call');
        setState('waiting');
      };

      voxbone.WebRTC.customEventHandler.registered = function(e) {
        appendMessage('ok', 'Registered');
        appendMessage('time', 'Waiting for incoming call');
        setState('waiting');
      };

      voxbone.WebRTC.customEventHandler.remoteMediaVolume = function(e) {
        clearDevice('phone-earphone');
        if (e.remoteVolume > 0.01) setEapDot('1');
        if (e.remoteVolume > 0.10) setEapDot('2');
        if (e.remoteVolume > 0.20) setEapDot('3');
      };

      voxbone.WebRTC.customEventHandler.localMediaVolume = function(e) {
        clearDevice('phone-microphone');
        if (e.localVolume > 0.01) setMicDot('1');
        if (e.localVolume > 0.10) setMicDot('2');
        if (e.localVolume > 0.20) setMicDot('3');
      };

      $scope.hangCall = function () {
        voxbone.WebRTC.hangup();
        setState('waiting');
      };
    };
  };
  PhoneController.$inject = ['$scope', '$http', '$window', '$timeout', '$controller'];

  return PhoneController;
});
