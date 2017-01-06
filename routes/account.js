// This module is to put all the functionality related to
// user account and profile stuff
var passport = require('passport');

var title = 'Did2Webr.tc';
var async = require('async');
var sendgrid = require('sendgrid')(process.env.SENDGRID_USERNAME, process.env.SENDGRID_PASSWORD);

var express = require('express');
var router = express.Router();

var recaptcha = require('express-recaptcha');
recaptcha.init(
  process.env.GOOGLE_RECAPTCHA_SITE_KEY,
  process.env.GOOGLE_RECAPTCHA_SECRET_KEY
);

var Account = require('../models/account');
var utils = require('./utils');
var emails = require('./emails');

var PERMITTED_FIELDS = [
  'first_name', 'last_name','company', 'phone', 'password',
  'confirmation', 'email', 'reference', 'ringtone'
];

router.get('/login', utils.redirectIfLoggedIn, function (req, res, next) {
  res.render('account/login', { title: title, email: req.query.email || '', message: req.flash('loginMessage') });
});

router.post('/login', function (req, res, next) {
  var formData = req.body;
  var result;

  passport.authenticate('local-login', function (err, account, info) {
    if (err) return console.log('Error:', err);

    if (account === false) {
      result = {
        message: "Email or password incorrect", errors: err,
        email: formData.email, flash: req.flash('loginMessage')
      };
      console.log("Entered incorrect authentication, response should be: 401");
      return res.status(401).json(result);
    } else if (!account.verified) {
      result = {
        message: "Unverified account:",
        email: formData.email,
        flash: req.flash('loginMessage')
      };
      console.log(result);
      return res.status(403).json(result);
    } else {
      result = { message: "", errors: null, redirect: '/pick-did', email: formData.email };

      req.logIn(account, function (err) {
        return res.status(200).json(result);
      });
    }
  })(req, res, next);
});

router.get('/logout', function (req, res) {
  req.logout();
  req.session.destroy();
  res.redirect('/');
});

router.get('/edit', utils.isLoggedIn, function (req, res) {
  Account
    .findOne({_id: req.user._id})
    .exec(function (err, user) {
      res.render('account/edit', { title: title, user: user });
    });
});

router.post('/edit', utils.isLoggedIn, function (req, res) {

  var req_parameters = req.parameters;
  var formData = req_parameters.permit(PERMITTED_FIELDS).value();
  var result = { message: "Succesfully saved", errors: true };

  Account.findOne({_id: req.user._id}, function (err, theAccount) {
    if (!theAccount) {
      result.message = "Account does not exist";
      return res.status(400).json(result);
    }

    theAccount.ringtone = formData.ringtone;
    theAccount.first_name = formData.first_name;
    theAccount.last_name = formData.last_name;
    theAccount.company = formData.company;
    theAccount.phone = formData.phone;
    theAccount.save(function (err) {
      if (err) throw err;
      result.errors = false;
      req.logIn(theAccount, function (err) {
        res.status(200).json(result);
      });
    });
  });
});

router.get('/signup', recaptcha.middleware.render, function (req, res, next) {
  var conference = req.query.conference;
  req.logout();
  req.session.destroy();
  res.render('account/signup', {
    title: title,
    email: req.query.email,
    temp_password: req.query.password,
    captcha: req.recaptcha,
    conference_name: conference,
    reference: req.param('ref')
  });
});

// POST /signup fetch the account with that email, set the new password and temporary to false.
router.post('/signup', recaptcha.middleware.verify, function (req, res, next) {
  var req_parameters = req.parameters;
  var formData = req_parameters.permit(PERMITTED_FIELDS).value();
  var result = { message: "", errors: true, redirect: "", email: formData.email };

  // making some validations no matter if account exists or not
  if (formData.password !== formData.confirmation) {
    result.message = "Validation failed. Password and Confirmation do not match";
    return res.status(400).json(result);
  }

  if (formData.password && formData.password.trim() < 8) {
    result.message = "Validation failed. Password policy not satisfied";
    return res.status(400).json(result);
  }

  if (req.recaptcha.error) {
    console.log(req.recaptcha);
    result.message = "Wrong Captcha! Please try again";
    return res.status(400).json(result);
  }

  Account.findOne({ email: formData.email }, function (err, theAccount) {
    // if account has password, it means was already registered. If not,
    // it was created while invite functionality was working.
    if (theAccount) {
      if (theAccount.password) {
        result.message = "Account already registered";
        return res.status(400).json(result);
      }
      theAccount.verified = true;
    } else {
      theAccount = new Account(
        {
          email: formData.email,
          verified: false
        }
      );
    }
    result.errors = false;
    theAccount.password = theAccount.generateHash(formData.password);
    theAccount.first_name = formData.first_name;
    theAccount.last_name = formData.last_name;
    theAccount.company = formData.company;
    theAccount.phone = formData.phone;
    theAccount.temporary = false;
    theAccount.reference = formData.reference;
    theAccount.referrer = req.cookies.referrer_url || 'no-referer';

    theAccount.save(function (err) {
      if (err) {
        // throw err;
        result.message = "err.message";
        return res.status(400).json(result);
      }

      result.verified = theAccount.verified;

      if (result.verified) {
        req.logIn(theAccount, function (err) {
          result.redirect = "/pick-did/";
          res.status(200).json(result);
        });
      } else {
        emails.sendPasswordReset(req, res, theAccount.email, 'verify');
      }
    });
  });
});

router.get('/forgot', function (req, res, next) {
  res.render('account/forgot', { title: title, email: req.query.email });
});

router.post('/forgot', function (req, res, next) {
  emails.sendPasswordReset(req, res, req.body.email, 'forgot');
});

router.get('/reset/:token', function (req, res) {
  Account.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function (err, account) {
    if (!account) {
      return res.render('account/forgot', {
        title: title, message: "Password reset token is invalid or has expired.", errors: err });
    }
    res.render('account/reset', {
      title: title,
      the_account: req.user,
      token: req.params.token,
      email: req.query.email
    });
  });
});

router.post('/reset/:token', function (req, res) {
  async.waterfall([
    function (done) {
      Account.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function (err, account) {
        var result;
        if (!account) {
          result = { message: "Password reset token is invalid or has expired.", errors: err };
          return res.status(400).json(result);
        }

        if (req.body.password !== req.body.confirmation) {
          result = { message: "Password and confirmation do not match.", errors: true };
          return res.status(400).json(result);
        }
        account.password = account.generateHash(req.body.password);
        account.resetPasswordToken = undefined;
        account.resetPasswordExpires = undefined;
        account.verified = true;

        account.save(function (err) {
          req.logIn(account, function (err) {
            done(err, account);
          });
        });
      });
    },
    function (account, done) {
      var email = new sendgrid.Email({to: account.email});

      email.from = process.env.SENDGRID_FROM;
      email.replyto = process.env.SENDGRID_FROM;
      email.subject = 'Did2Webr.tc - Your password has been changed';
      email.html = ' ';

      email.addFilter('templates', 'enable', 1);
      email.addFilter('templates', 'template_id', process.env.SENDGRID_PASSWORD_CHANGED_TEMPLATE);

      sendgrid.send(email, function (err, json) {
        req.flash('success', 'Success! Your password has been changed.');
        done(err);
      });
    }
  ], function (err) {
    var result;
    if (err) {
      result = { message: "An error has ocurred.", errors: err };
      return res.status(400).json(result);
    }else{
      result = { message: "Your password has been changed.", errors: null, redirect: '/pick-did' };
      return res.status(200).json(result);
    }
  });
});

router.get('/verify/:token', function (req, res, next) {
  req.logout();

  Account.findOne({ verifyAccountToken: req.params.token, verifyAccountExpires: { $gt: Date.now() } }, function (err, account) {
    if (account) {
      if (account.verified) {
        return renderLogin(res, "Account verification already completed. Please login", null);
      } else {
        account.verified = true;
        account.save(function (err) {
          return renderLogin(res, "Account verification successful. Please login", null);
        });
      }
    } else {
      return renderLogin(res, "Account verification token is invalid or has expired.", "TokenInvalidOrExpired");
    }
  });

  function renderLogin(res, message, error) {
    var errorMessage = {
      error: error,
      type: (error ? 'danger' : 'success'),
      message: message
    };

    req.flash('loginMessage', errorMessage);

    return res.render('account/login', {
      title: title,
      error: error,
      message: req.flash('loginMessage')
    });
  }
});

module.exports = router;
