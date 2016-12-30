var GitHubStrategy = require('passport-github2').Strategy;

module.exports = function(Account, passport) {
  passport.use(new GitHubStrategy({
      clientID: process.env.GITHUB_OAUTH2_KEY,
      clientSecret: process.env.GITHUB_OAUTH2_SECRET_KEY,
      callbackURL: process.env.APP_URL + "/auth/github/callback",
      passReqToCallback: true
    },
    function(req, token, refreshToken, profile, done) {
      if(typeof(profile.emails) === 'undefined') {
        var errorMessage = { error: 'missing-email', type: 'danger', message: 'We cannot retrieve your email from Github. Please fix this in your Github settings page.' };
        return done(null, false, req.flash('loginMessage', errorMessage));
      }

      process.nextTick(function() {
        Account.findOne({ $or: [ { github_id: profile.id }, { email: profile.emails[0].value } ] }, function(err, account) {
          if (err)
            return done(err);
          if (account) {
            account.github_token = token;
            account.github_id = profile.id;
            account.save(function(err) {
              if (err)
                throw err;
              return done(null, account);
            });
          } else {
            var names = profile.displayName.split(' ');

            var theAccount = new Account(
              {
                email: profile.emails[0].value,
                temporary: false,
                github_token: token,
                github_id: profile.id,
                first_name: names[0],
                last_name: names[names.length - 1]
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
