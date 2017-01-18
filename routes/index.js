var pjson = require('../package.json');
var express = require('express');
var router = express.Router();
var utils = require('./utils');
var Account = require('../models/account');
var Demo = require('../models/demo');
var request = require('request');
var Voxbone = require('voxbone-webrtc');

//Your Voxbone WebRTC credentials
var voxrtc_username = process.env.VOXBONE_WEBRTC_USERNAME;
var voxrtc_secret = process.env.VOXBONE_WEBRTC_PASSWORD;

//New Voxbone Object used for authentication
var voxbone = new Voxbone({
    voxrtcUsername: voxrtc_username,
    voxrtcSecret: voxrtc_secret
});

// Required for auto Let's Encrypt cert generation
// https://github.com/dmathieu/sabayon
router.get('/.well-known/acme-challenge/:acmeToken', function(req, res, next) {
  var acmeToken = req.params.acmeToken;
  var acmeKey;

  if (process.env.ACME_KEY && process.env.ACME_TOKEN) {
    if (acmeToken === process.env.ACME_TOKEN) {
      acmeKey = process.env.ACME_KEY;
    }
  }

  for (var key in process.env) {
    if (key.startsWith('ACME_TOKEN_')) {
      var num = key.split('ACME_TOKEN_')[1];
      if (acmeToken === process.env['ACME_TOKEN_' + num]) {
        acmeKey = process.env['ACME_KEY_' + num];
      }
    }
  }

  if (acmeKey) res.send(acmeKey);
  else res.status(404).send();
});

router.get('*', function (req, res, next) {
  //  Check for unsupported browsers
  if (!utils.isSupportedBrowser(req) && req.url !== '/') {
    res.redirect('/');
    return;
  }
  // Redirects if not HTTPS
  if (process.env.FORCE_HTTPS == 'true' && process.env.APP_URL && req.headers['x-forwarded-proto'] != 'https')
    res.redirect(process.env.APP_URL + req.url);
  else
    next();
});

router.get('/', function (req, res, next) {
  var unsupported_browser = null;

  if (!utils.isSupportedBrowser(req))
    unsupported_browser = utils.getReqBrowser(req);

  res.render('home', {unsupported_browser: unsupported_browser});
});

router.get('/ping', function (req, res, next) {
  res.json({ 'ping': Date.now(), 'version': pjson.version });
});

router.get('/pick-did', utils.isLoggedIn, function (req, res, next) {
  var userDids = res.locals.currentUser.dids;
  if(userDids.length)
    res.render('show-did', {dids: userDids});
  else
    res.render('pick-did');
});

router.get('/edit-notifications', utils.isLoggedIn, function (req, res, next) {
  res.render('edit-notifications');
});

router.get('/phone', utils.isLoggedIn, function (req, res, next) {
  var ringtone = res.locals.currentUser.ringtone;
  var browserNotifications = res.locals.currentUser.browserNotifications;
  var userDid = null;
  var uemail = res.locals.currentUser.email;

  if (res.locals.currentUser.dids.length)
    userDid = res.locals.currentUser.dids;

  voxrtc_config = voxbone.generate();
  var config = {
    vox_username: voxrtc_username,
    vox_password: voxrtc_secret,
    voxbone_webrtc_username: voxrtc_username,
    apiBrowserName: res.locals.currentUser.apiBrowsername
  };

  res.render('phone', {
    dids: userDid,
    config: config,
    ringtone: ringtone,
    browserNotifications: browserNotifications,
    email: uemail
  });
});

router.get('/demo', function (req, res, next) {
  Demo
    .findOne({})
    .sort({'updated_at': 1})
    .exec(function (err, theDemo) {

      if (!theDemo) {
        return res.status(400).json("Demo does not exist");
      }

      theDemo.save(function (err) {
        if (err) throw err;
      });
      voxrtc_config = voxbone.generate();
      var config = {
        vox_username: voxrtc_username,
        vox_password: voxrtc_secret,
        voxbone_webrtc_username: voxrtc_username,
        apiBrowserName: theDemo.name
      };

      res.render('demo', {
        config: config,
        ringtone: 'office',
        widget_id: theDemo.widget_id,
        internal_sip: theDemo.sip,
        dids: theDemo.dids,
        email: theDemo.name + '@did2webrtcdemo.com'
      });
  });
});

module.exports = router;
