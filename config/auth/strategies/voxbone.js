var passport = require('passport');
var OAuth2Strategy = require('passport-oauth').OAuth2Strategy;
var requestify = require('requestify');

OAuth2Strategy.prototype.userProfile = function(accessToken, done) {
  var profile_url = process.env.VOXBONE_OAUTH2_PROFILE_URL + '?access_token=' + accessToken;
  requestify.get(profile_url).then(function(response) {
    var rawUserProfile = response.getBody();
    var profile = { id: rawUserProfile.id };

    // Flattening the response to a single object
    for(var i = 0; i < rawUserProfile.attributes.length; i++){
      for(var x in rawUserProfile.attributes[i]){
        profile[x] = rawUserProfile.attributes[i][x];
      }
    }

    return done(null, profile);
  });
};

module.exports = function(Account, passport) {
  passport.use('voxbone', new OAuth2Strategy({
      authorizationURL: process.env.VOXBONE_OAUTH2_AUTH_URL,
      tokenURL: process.env.VOXBONE_OAUTH2_TOKEN_URL,
      clientID: process.env.VOXBONE_OAUTH2_KEY,
      clientSecret: process.env.VOXBONE_OAUTH2_SECRET_KEY,
      callbackURL: process.env.APP_URL + "/auth/voxbone/callback"
    },
    function(token, refreshToken, profile, done) {
      if(typeof(profile.email) === 'undefined'){
        var errorMessage = { error: 'missing-email', type: 'danger', message: 'We cannot retrieve your email from Voxbone' };
        return done(null, false, req.flash('loginMessage', errorMessage));
      }

      process.nextTick(function() {
        Account.findOne({ $or: [ { voxbone_id: profile.id }, { email: profile.email } ] }, function(err, account) {
          if (err)
            return done(err);
          if (account) {
            account.voxbone_token = token;
            account.voxbone_id = profile.id;
            account.save(function(err) {
              if (err)
                throw err;
              return done(null, account);
            });
          } else {
            var theAccount = new Account(
              {
                email: profile.email,
                temporary: false,
                voxbone_token: token,
                voxbone_id: profile.id,
                first_name: profile.firstname,
                last_name: profile.lastname,
                company: profile.company
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
