var WindowsLiveStrategy = require('passport-windowslive').Strategy;

module.exports = function(Account, passport) {
  passport.use(new WindowsLiveStrategy({
      clientID: process.env.WINDOWSLIVE_OAUTH2_KEY,
      clientSecret: process.env.WINDOWSLIVE_OAUTH2_SECRET_KEY,
      callbackURL: process.env.APP_URL + "/auth/windowslive/callback",
    },
    function(token, refreshToken, profile, done) {
      process.nextTick(function() {

        if(typeof(profile.emails) === 'undefined'){
          var errorMessage = { error: 'missing-email', type: 'danger', message: 'We cannot retrieve your email from Windows Live. Please fix this in your Windows Live settings page.' };
          return done(null, false, req.flash('loginMessage', errorMessage));
        }

        Account.findOne({ $or: [ { windowslive_id: profile.id }, { email: profile.emails[0].value } ] }, function(err, account) {
          if (err)
            return done(err);
          if (account) {
            account.windowslive_token = token;
            account.windowslive_id = profile.id;
            account.save(function(err) {
              if (err)
                throw err;
              return done(null, account);
            });
          } else {
            var theAccount = new Account(
              {
                email: profile.emails[0].value,
                temporary: false,
                windowslive_token: token,
                windowslive_id: profile.id,
                first_name: profile.name.givenName,
                last_name: profile.name.familyName
              }
            );
            theAccount.save(function(err) {
              if (err)
                throw err;
              return done(null, theAccount);
            });
          }
        });
      });
    }
  ));
};
