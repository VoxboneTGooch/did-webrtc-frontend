var mongoose = require('mongoose');
var dbURI = process.env.MONGODB_URI || 'mongodb://localhost/did-webrtcDB';
var Account = require('../models/account');
var Country = require('../models/country');
var Demo = require('../models/demo');
var request = require('request');
var utils = require('../routes/utils');

mongoose.connect(dbURI);

//Check for demo user for testing purposes
Account.findOne({email: "demo.user@did2webr.tc"}, function (err, demoAccount) {
  if (!demoAccount) {
    console.log("Generating demo user...");
    demoAccount = new Account(
      {
        email: "demo.user@did2webr.tc",
        verified: true,
        first_name: "Demo",
        last_name: "User",
        company: "Voxbone",
        phone: "+5555555",
        referrer: "no-referer",
        temporary: false
      }
    );
    demoAccount.password = demoAccount.generateHash("password");
    demoAccount.save(function (err) {
      if (err)
        console.log("Demo user couldn't be generated");
    });
  }
});

function generateDemos (index) {
  Demo.findOne({name: "demo" + index}, function (err, demo) {
    var internalSip = process.env.VOXBONE_WEBRTC_USERNAME + "+demo" + index + "@workshop-gateway.voxbone.com";
    var options = {
      url: 'https://click2vox.com/widget/get-id?sipuri=' + encodeURIComponent(internalSip),
      method: 'GET',
      "rejectUnauthorized": false
    };
    var dids = [
      {"did_number":"+555555555", "country_iso2":"us"},
      {"did_number":"+555555555", "country_iso2":"be"}
    ];

    if (!demo) {
      request(options, function(error, response, body) {

        if (!error && body) {
          console.log("Generating demo " + index);
          demo = new Demo(
            {
              name: "demo" + index,
              sip: internalSip,
              widget_id: JSON.parse(body) || "Get manually from click2vox",
              dids: dids
            }
          );
          demo.save(function (err) {

            if(err)
              console.log("Demo" + index + "couldn't be generated");
            if (index < 10)
              generateDemos(index + 1);

          });
        }

      });
    } else if (index < 10) {
      generateDemos(index + 1);
    }
  });
}

generateDemos(1);

var options = {
  url: process.env.VOXBONE_PROVISIONING_API_URL + '/inventory/country?pageNumber=0&pageSize=900',
  method: 'GET',
  headers: utils.provisioningApiHeaders,
  auth: utils.provisioningApiCredentials,
};

function fillCountries(length, index, supportedCountries) {
  var supportedCountry = supportedCountries[index];
  Country.findOne({countryCodeA3: supportedCountry.countryCodeA3}, function (err, country) {

    if (!country) {
      console.log("Filling listed country");
      var countryNameCapitals = supportedCountry.countryName;
      var countryNameCamel = countryNameCapitals[0].toUpperCase() + countryNameCapitals.slice(1).toLowerCase();
      country = new Country(
        {
          countryCodeA3: supportedCountry.countryCodeA3,
          countryName: countryNameCamel,
          phoneCode: supportedCountry.phoneCode,
          hasStates: JSON.parse(supportedCountry.hasStates),
          hasRegulationRequirement: JSON.parse(supportedCountry.hasRegulationRequirement)
        }
      );
      country.save(function (err) {
        if(index < length - 1)
          fillCountries(length, index + 1, supportedCountries);
      });
    } else if(index < length - 1) {
      fillCountries(length, index + 1, supportedCountries);
    }

  });
}

function callback(error, response, body) {

  if (!error && response.statusCode == 200) {
    var supportedCountries = JSON.parse(body).countries;
    fillCountries(supportedCountries.length, 0, supportedCountries);
  }

}

request(options, callback);

module.exports = dbURI;
