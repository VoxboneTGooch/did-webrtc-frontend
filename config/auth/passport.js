var Account = require('../../models/account');

module.exports = function(passport) {
  require('./strategies/github')(Account, passport);
  require('./strategies/google')(Account, passport);
  require('./strategies/linkedin')(Account, passport);
  require('./strategies/windowslive')(Account, passport);
  require('./strategies/voxbone')(Account, passport);
  require('./strategies/local-login')(Account, passport);

  passport.serializeUser(function(account, done) {
    done(null, account.id);
  });

  passport.deserializeUser(function(id, done) {
    Account.findById(id, function(err, account) {
      done(err, account);
    });
  });
};
