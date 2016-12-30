// Here it goes only mailing methods
var sendgrid = require('sendgrid')(process.env.SENDGRID_USERNAME, process.env.SENDGRID_PASSWORD);
var async = require('async');
var crypto = require('crypto');

var Account = require('../models/account');

module.exports = {
  sendPasswordReset: function (req, res, email, action) {
    async.waterfall([
      function (done) {
        crypto.randomBytes(20, function (err, buf) {
          var token = buf.toString('hex');
          done(err, token);
        });
      },
      function (token, done) {
        Account.findOne({ email: email }, function (err, account) {
          if (!account) {
            var result = { message: "No account with that email address exists.", errors: err };
            return res.status(404).json(result);
          }

          if (action === 'forgot') {
            account.resetPasswordToken = token;
            account.resetPasswordExpires = Date.now() + 3600000; // 1 hour
          } else {
            account.verifyAccountToken = token;
            account.verifyAccountExpires = Date.now() + (3600000 * 24); // 1 day
          }

          account.save(function (err) {
            done(err, token, account);
          });
        });
      },
      function (token, account, done) {
        var email = new sendgrid.Email({to: account.email});
        email.from = process.env.SENDGRID_FROM;
        email.replyto = process.env.SENDGRID_FROM;

        email.html = ' ';
        email.addFilter('templates', 'enable', 1);

        var template_id;
        if (action === 'forgot') {
          template_id = process.env.SENDGRID_PASSWORD_RESET_TEMPLATE;
          email.subject = 'Did2Webr.tc - Password Reset';
          email.addSubstitution ('-button_link-', process.env.APP_URL + '/account/reset/' + token);
        } else {
          template_id = process.env.SENDGRID_VERIFY_ACCOUNT_TEMPLATE;
          email.subject = 'Did2Webr.tc - Account Verification';
          email.addSubstitution ('-button_link-', process.env.APP_URL + '/account/verify/' + token);
        }
        email.addFilter('templates', 'template_id', template_id);

        sendgrid.send(email, function (err, json) {
          var result = {
            message: [
              "An e-mail has been sent to", account.email,
              "with further instructions. Please check your inbox."
            ].join(" "),
            errors: null
          };
          return res.status(200).json(result);
        });
      }
    ], function (err) {
      if (err) return next(err);
      var result = { message: "There was an error", errors: err };
      res.status(500).json(result);
    });
  }
};
