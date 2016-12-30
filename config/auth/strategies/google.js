var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;

module.exports = function(Account, passport) {
  passport.use(new GoogleStrategy({
      clientID: process.env.GOOGLE_OAUTH2_KEY,
      clientSecret: process.env.GOOGLE_OAUTH2_SECRET_KEY,
      callbackURL: process.env.APP_URL + "/auth/google/callback",
    },
    function(token, refreshToken, profile, done) {

      if(typeof(profile.emails) === 'undefined'){
        var errorMessage = { error: 'missing-email', type: 'danger', message: 'We cannot retrieve your email from Google. Please fix this in your Google settings page.' };
        return done(null, false, req.flash('loginMessage', errorMessage));
      }

      process.nextTick(function() {
        Account.findOne({ $or: [ { google_id: profile.id }, { email: profile.emails[0].value } ] }, function(err, account) {
          if (err)
            return done(err);
          if (account) {
            account.google_token = token;
            account.google_id = profile.id;
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
                google_token: token,
                google_id: profile.id,
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
