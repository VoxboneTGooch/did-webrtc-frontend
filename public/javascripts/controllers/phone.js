define(['jquery', 'bootstrap'], function(jQuery) {

  var PhoneController = function($scope, $http, $window, $timeout) {
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
      jQuery('#microphone #mic' + dot).addClass('active');
    }

    function setEapDot(dot) {
      jQuery('#earphone #eap' + dot).addClass('active');
    }

    function filterRegistrarURI (registrarURI) {

      if (!registrarURI)
        return null;

      var sipIndex = registrarURI.indexOf('sip:') + 4;
      var portIndex = registrarURI.search(/(?:[^sip]):\d+/) - 3;
      return registrarURI.substring(sipIndex).substring(0, portIndex).trim();
    }

    $scope.init = function (vox_username, vox_password, ringtone, apiBrowserName) {
      var req_url;

      if (apiBrowserName)
        req_url = '/api/userInfo?apiBrowserName=' + apiBrowserName;
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
        voxbone.WebRTC.configuration.uri = 'sip:' + $scope.user.browserUsername + '@workshop-gateway.voxbone.com';
        voxbone.WebRTC.basicAuthInit(vox_username, vox_password);

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
        clearDevice('earphone');
        if (e.remoteVolume > 0.01) setEapDot('1');
        if (e.remoteVolume > 0.10) setEapDot('2');
        if (e.remoteVolume > 0.20) setEapDot('3');
      };

      voxbone.WebRTC.customEventHandler.localMediaVolume = function(e) {
        clearDevice('microphone');
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
  PhoneController.$inject = ['$scope', '$http', '$window', '$timeout'];

  return PhoneController;
});
