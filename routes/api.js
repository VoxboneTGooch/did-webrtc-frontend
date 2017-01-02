var express = require('express');
var router = express.Router();
var request = require('request');
var callingCountries = require('country-data').callingCountries;
var isoCountries = require("i18n-iso-countries");
var async = require('async');
var utils = require('./utils');
var NodeCache = require("node-cache");
var _ = require('underscore');

router.get('/getCountriesList', utils.isLoggedIn, function(req, res, next) {
  var options = {
    url: process.env.VOXBONE_PROVISIONING_API_URL + '/inventory/did?pageNumber=0&pageSize=900',
    headers: utils.provisioningApiHeaders,
    auth: utils.provisioningApiCredentials
  };
  utils.getListedCountries(function(listedCountries){
    request(options, function(error, response, body) {
      var availableCountries = [];

      if (!error && response.statusCode == 200) {
        var dids = JSON.parse(body).dids;
        var dist_countries = [];
        var phoneCode;
        var country;
        /*This gets into result the first Id of each individual country listed
        with its corresponding DID*/
        dids.forEach(function(did) {

          if ((did.voiceUriId === null) && (dist_countries.indexOf(did.countryCodeA3) == -1)) {
            dist_countries.push(did.countryCodeA3);

            if (callingCountries[did.countryCodeA3])
              phoneCode = callingCountries[did.countryCodeA3].countryCallingCodes[0];
            else //inum world special case
              phoneCode = '+883';

            didCountryIso2 = (isoCountries.alpha3ToAlpha2(did.countryCodeA3) || 'WLD').toLowerCase();
            listedCountries = _.filter(listedCountries, function(o) {
              return o.iso2 !== didCountryIso2;
            });
            country = {
              "name": (isoCountries.getName(did.countryCodeA3, "en") || 'world') + ' (' + phoneCode + ') - Available',
              "iso2": didCountryIso2,
              "DID": did.e164
            };
            listedCountries.push(country);
            availableCountries.push(country);
          }
        });
      }
      listedCountries = _.sortBy(listedCountries, function(o) { return o.name; });
      res.json({
        "listedCountries": listedCountries,
        "availableCountries": availableCountries
      });
    });
  });
});

router.post('/linkDIDs', utils.isLoggedIn, function(req, res, next) {

  var account = res.locals.currentUser;

  if (account.dids.length)
    return res.status(400).json("This account already has DIDS assigned to it");

  var voiceUriId = account.voiceUriId;
  var DID1 = req.body[0];
  var DID2 = {
    did_number: null,
    country_iso2: null
  };

  if (req.body.length == 2)
    DID2 = req.body[1];

  //gets 2 DID ids
  async.parallel([
      function(callback) {
        getDidInfo(DID1.did_number, callback);
      },
      function(callback) {
        getDidInfo(DID2.did_number, callback);
      }
    ],
    function(err, didsInfo) {
      var index = didsInfo.indexOf(null);
      if (index != -1)
        didsInfo.splice(index, 1);

      var didIds = _.map(didsInfo, function(didInfo) {
        return didInfo.id;
      });

      var options = {
        url: process.env.VOXBONE_PROVISIONING_API_URL + '/configuration/configuration',
        method: 'POST',
        headers: utils.provisioningApiHeaders,
        auth: utils.provisioningApiCredentials,
        json: {
          "didIds": didIds,
          "voiceUriId": voiceUriId
        }
      };

      function callback(error, response, body) {
        if (!error && response.statusCode == 200) {
          if (DID1.did_number) account.dids.push(DID1);
          if (DID2.did_number) account.dids.push(DID2);
          account.save();

          return res.status(200).json();
        } else {
          return res.status(400).json();
        }
      }

      var takenNumbers = [];
      didsInfo.forEach(function(didInfo) {
        if (didInfo.voiceUriId)
          takenNumbers.push(didInfo.e164);
      });

      if (!takenNumbers.length) //the selected dids are all available
        request(options, callback);
      else
        return res.status(400).json(takenNumbers);
    });
});

router.get('/userInfo', function(req, res, next) {
  var apiUserId;

  if(req.query.apiBrowserName)
    apiUserId = req.query.apiBrowserName;
  else if(req.isAuthenticated())
    apiUserId = res.locals.currentUser.apiBrowsername;
  else
    return res.status(400).json();

  var options = {
    url: process.env.SIP_TO_WEBRTC_API_URL + '/' + process.env.VOXBONE_WEBRTC_USERNAME + '/users/' + apiUserId,
    method: 'GET',
    headers: utils.sip2webrtcApiHeaders
  };

  function callback(error, response, body) {
    if (!error && response.statusCode == 200) {
      return res.status(200).json(body);
    } else {
      return res.status(400).json();
    }
  }

  request(options, callback);
});

router.post('/createUser', utils.isLoggedIn, function(req, res, next) {
  var apiBrowserUsername;
  var account = res.locals.currentUser;

  if(req.body)
    apiBrowserUsername = req.body.apiBrowserUsername;
  else
    return res.status(400).json();

  utils.createUser(account, apiBrowserUsername, function(newId){
    return res.status(200).json(newId);
  });

});

router.delete('/deleteUser', utils.isLoggedIn, function(req, res, next) {

  var apiUserId;
  if(req.body)
    apiUserId = req.body.apiBrowserUsername;
  else
    return res.status(400).json();

  var options = {
    url: process.env.SIP_TO_WEBRTC_API_URL + '/' + process.env.VOXBONE_WEBRTC_USERNAME + '/users/' + apiUserId,
    method: 'DELETE',
    headers: utils.sip2webrtcApiHeaders
  };

  function callback(error, response, body) {

    if (!error && response.statusCode == 200) {
      return res.status(200).json();
    } else {
      return res.status(400).json();
    }

  }

  request(options, callback);
});

router.put('/editUser', utils.isLoggedIn, function(req, res, next) {
  var apiUserId = res.locals.currentUser.apiBrowsername;
  var options = {
    url: process.env.SIP_TO_WEBRTC_API_URL + '/' + process.env.VOXBONE_WEBRTC_USERNAME + '/users/' + apiUserId,
    method: 'PUT',
    headers: utils.sip2webrtcApiHeaders,
    json: req.body
  };

  function callback(error, response, body) {

    if (!error && response.statusCode == 200) {
      return res.status(200).json();
    } else {
      return res.status(400).json();
    }
  }

  request(options, callback);
});

module.exports = router;
