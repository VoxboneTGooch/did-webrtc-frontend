// This module is to put all the functionality related to
// user account and profile stuff

var express = require('express');
var router = express.Router();

var passport = require('passport');

var callbackRedirects = {
  successRedirect : '/edit-sip',
  failureRedirect : '/account/login'
};

var authenticateCallback = function(req, res, next) {
  passport.authenticate(this, function(err, user, info) {
    if (err) {
      console.log(err);
      var errorMessage = { error: 'generic-error', type: 'danger', message: err.message + '. Please try again later' };
      req.flash('loginMessage', errorMessage);
      return res.redirect(callbackRedirects.failureRedirect);
    }

    if (!user)
      return res.redirect(callbackRedirects.failureRedirect);

    req.logIn(user, function(err) {
      if (err)
        return next(err);
      return res.redirect(callbackRedirects.successRedirect);
    });
  })(req, res, next);
};

router.get('/github', passport.authenticate('github', { scope: ['user:email'] }));
router.get('/github/callback', authenticateCallback.bind('github'));

router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
router.get('/google/callback', authenticateCallback.bind('google'));

router.get('/linkedin', passport.authenticate('linkedin', { state: 'SOME STATE' }));
router.get('/linkedin/callback', authenticateCallback.bind('linkedin'));

router.get('/windowslive', passport.authenticate('windowslive', { scope: ['wl.signin', 'wl.emails'] }));
router.get('/windowslive/callback', authenticateCallback.bind('windowslive'));

router.get('/voxbone', passport.authenticate('voxbone', { scope: [] }));
router.get('/voxbone/callback', authenticateCallback.bind('voxbone'));

module.exports = router;
