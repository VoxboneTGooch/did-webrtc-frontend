var LinkedInStrategy = require('passport-linkedin-oauth2').Strategy;

module.exports = function(Account, passport) {
  passport.use(new LinkedInStrategy({
      clientID: process.env.LINKEDIN_OAUTH2_KEY,
      clientSecret: process.env.LINKEDIN_OAUTH2_SECRET_KEY,
      callbackURL: process.env.APP_URL + "/auth/linkedin/callback",
      scope: ['r_basicprofile', 'r_emailaddress']
    },
    function(token, refreshToken, profile, done) {
      if(typeof(profile.emails) === 'undefined'){
        var errorMessage = { error: 'missing-email', type: 'danger', message: 'We cannot retrieve your email from LinkedIn. Please fix this in your LinkedIn settings page.' };
        return done(null, false, req.flash('loginMessage', errorMessage));
      }

      process.nextTick(function() {
        Account.findOne({ $or: [ { linkedin_id: profile.id }, { email: profile.emails[0].value } ] }, function(err, account) {
          if (err)
            return done(err);
          if (account) {
            account.linkedin_token = token;
            account.linkedin_id = profile.id;
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
                linkedin_token: token,
                linkedin_id: profile.id,
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
