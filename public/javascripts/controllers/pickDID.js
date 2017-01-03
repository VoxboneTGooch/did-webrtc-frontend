define([
  'jquery',
  'countrySelect',
  'underscore'
  ], function (jQuery, countrySelect, _) {

  var PickDIDController = function ($scope, $http, $window, $timeout) {
    getCountries();
    var listedCountries;
    var availableCountries;
    var selectedCountries = {
      country1: null,
      country2: null
    };
    $scope.apiAlert = {};
    $scope.unavailableSecondDid = true;

    jQuery(".countrySelector").on("change", function () {
      var selector = jQuery(this);
      var _self = this;

      if (!selector.countrySelect("getSelectedCountryData").DID) {
        $timeout(function(){

          if (_self.id === "country1")
            selector.countrySelect("selectCountry", selectedCountries.country1);
          else
            selector.countrySelect("selectCountry", selectedCountries.country2);

          $scope.updateSelectors();
        }, 50);
        $scope.mailTo(selector.countrySelect("getSelectedCountryData").name);
      } else {

        if (_self.id === "country1")
          selectedCountries.country1 = selector.countrySelect("getSelectedCountryData").iso2;
        else
          selectedCountries.country2 = selector.countrySelect("getSelectedCountryData").iso2;

      }

      $scope.updateSelectors();
      $scope.$apply();
    });

    $scope.linkDID = function () {
      $scope.apiAlert = {
        message: "Provisioning DID, please wait...",
        cssType: "info"
      };

      var dids = [];
      dids.push($scope.DID1);
      if ($scope.showOptionalDid)
        dids.push($scope.DID2);

      var req = {
        method: 'POST',
        url: '/api/linkDIDs',
        headers: {
          'Content-Type': 'application/json; charset=utf-8'
        },
        data: dids
      };

      $http(req).then(function () {
        $scope.apiAlert = {
          message: "This DID has been succesfuly linked to your webphone, redirecting...",
          cssType: "success"
        };

        $timeout(function () {
          $window.location.href = "/edit-notifications";
        }, 500);

      }, function (response) {
        var rejectedDids = response.data;
        var takenMessage = '';

        if (rejectedDids.length == 1)
          takenMessage = "Please Select another DID, the DID " + rejectedDids[0] + " has already been taken.";
        if (rejectedDids.length == 2)
          takenMessage = "Please Select another DID, both DIDS you chose have already been taken (" + rejectedDids[0] + ", " + rejectedDids[1] + ")";

        $scope.apiAlert = {
          message: takenMessage,
          cssType: "info"
        };
      });
    };

    $scope.updateSelectors = function () {
      var iso2_cnt1, iso2_cnt2 = null;
      iso2_cnt1 = jQuery("#country1").countrySelect("getSelectedCountryData").iso2;
      if ($scope.showOptionalDid) {
        iso2_cnt2 = jQuery("#country2").countrySelect("getSelectedCountryData").iso2;
      }
      updateSelection(iso2_cnt1, iso2_cnt2);
    };

    $scope.mailTo = function (countryName){
      countryName = countryName.substring(0, countryName.indexOf(" ("));
      var mailtoLink = "mailto:workshop@voxbone.com?subject=Interest in voxconf.me with " + countryName;
      mailtoLink += "&body=I would like to use a " + countryName + " number for a voxconf.me test.";
      window.open(
        mailtoLink,
        '_blank'
      );
    };

    function getCountries () {
      $scope.didRetrieveMessage = 'Retrieving DID2Webrtc available DIDs...';
      $http({
        method: 'GET',
        url: '/api/getCountriesList'
      }).then(function successCallback (response) {
        //sets global plugin data
        jQuery.fn.countrySelect.setCountryData(response.data.listedCountries);
        listedCountries = getAvailableISO2Codes(response.data.listedCountries);
        availableCountries = getAvailableISO2Codes(response.data.availableCountries);

        if (listedCountries.length)
          initSelectors();
        else {
          $scope.didRetrieveMessage = '';
          $scope.apiAlert = {
            message: "All the DIDS have been taken, please come back later",
            cssType: "danger"
          };
        }

      }, function errorCallback (response) {
        $scope.didRetrieveMessage = '';
        $scope.apiAlert = {
          message: "We couldn't retrieve the DIDs. Please try again later",
          cssType: "danger"
        };
      });
    }

    function initSelectors () {
      //init plugin on each selector
      jQuery("#country1").countrySelect({
        preferredCountries: [],
        onlyCountries: listedCountries
      });

      if (availableCountries.length > 1) {
        jQuery("#country2").countrySelect({
          preferredCountries: [],
          onlyCountries: listedCountries
        });
        $scope.unavailableSecondDid = false;
      }

      $http({
        method: 'GET',
        url: '//freegeoip.net/json/'
      }).then(function successCallback (response) {
        setInitialCountry(response.data.country_code.toLowerCase());
      }, function errorCallback (response) {
        setInitialCountry('us');
        $scope.apiAlert = {
          message: "We couldn't retrieve your location. Setting default country.",
          cssType: "warning"
        };
      });
    }

    function setInitialCountry (userLocationIso2) {
      var countryData = jQuery.fn.countrySelect.getCountryData();
      var present = _.findWhere(countryData, { iso2: userLocationIso2 });

      if (present) //The user is in a listed country
        jQuery("#country1").countrySelect("selectCountry", userLocationIso2);
      else if (_.findWhere(countryData, { iso2: "us" })) //if us is available, pick it
        jQuery("#country1").countrySelect("selectCountry", "us");
      else //in other case, pick random
        jQuery("#country1").countrySelect("selectCountry", _.sample(availableCountries));

      //for country 2 always pick a random country
      var selected_cnt1 = jQuery("#country1").countrySelect("getSelectedCountryData").iso2;
      selectedCountries.country1 = selected_cnt1;
      var availableCountries2 = _.without(availableCountries, selected_cnt1);
      jQuery("#country2").countrySelect("selectCountry", _.sample(availableCountries2));
      var selected_cnt2 = jQuery("#country2").countrySelect("getSelectedCountryData").iso2;
      selectedCountries.country2 = selected_cnt2;
      $scope.updateSelectors();
      $scope.showCountryPickers = true;
    }

    function updateSelection (selected_cnt1, selected_cnt2) {
      var listedCountries1, listedCountries2;
      listedCountries1 = listedCountries;
      listedCountries2 = _.without(listedCountries, selected_cnt1);

      if (selected_cnt2) {
        listedCountries1 = _.without(listedCountries, selected_cnt2);
        jQuery("#country2").countrySelect("destroy");
        jQuery("#country2").countrySelect({
          preferredCountries: [],
          onlyCountries: listedCountries2
        });

        if (selected_cnt1 !== selected_cnt2)
          jQuery("#country2").countrySelect("selectCountry", selected_cnt2);
        else
          jQuery("#country2").countrySelect("selectCountry", _.sample(listedCountries2));

        var selection2 = jQuery("#country2").countrySelect("getSelectedCountryData");
        $scope.DID2 = {
          did_number: selection2.DID,
          country_iso2: selection2.iso2,
          name: selection2.name
        };
      }

      jQuery("#country1").countrySelect("destroy");
      jQuery("#country1").countrySelect({
        preferredCountries: [],
        onlyCountries: listedCountries1
      });
      jQuery("#country1").countrySelect("selectCountry", selected_cnt1);
      var selection1 = jQuery("#country1").countrySelect("getSelectedCountryData");
      $scope.DID1 = {
        did_number: selection1.DID,
        country_iso2: selection1.iso2,
        name: selection1.name
      };
    }

    function getAvailableISO2Codes (data) {
      var availableISO2Codes = [];
      for (var i in data) {
        availableISO2Codes.push(data[i].iso2);
      }
      return availableISO2Codes;
    }
  };
  PickDIDController.$inject = ['$scope', '$http', '$window', '$timeout'];

  return PickDIDController;
});
