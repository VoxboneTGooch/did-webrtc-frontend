var mongoose = require('mongoose');
var dbURI = process.env.MONGODB_URI || 'mongodb://localhost/did-webrtcDB';
var Account = require('../models/account');
var Demo = require('../models/demo');
var request = require('request');

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
      method: 'GET'
    };
    if (!demo) {
      request(options, function(error, response, body) {

        if (!error && body) {
          console.log("Generating demo " + index);
          demo = new Demo(
            {
              name: "demo" + index,
              sip: internalSip,
              widget_id: JSON.parse(body) || "Get manually from click2vox",
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

var index = 1;
generateDemos(index);

module.exports = dbURI;
