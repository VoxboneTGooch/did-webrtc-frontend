if (process.env.NEW_RELIC_LICENSE_KEY)
  var newrelic = require('newrelic');

var pjson = require('./package.json');
var utils = require('./routes/utils');

var title = 'DID-WebRTC v' + pjson.version;

var session = require('express-session');
var MongoStore = require('connect-mongo')(session);
var params = require('strong-params');
var passport = require('passport');
var flash = require('connect-flash');

var Account = require('./models/account');
var dbURI = require('./db/configuration');

require('./config/auth/passport')(passport);

var express = require('express');
var timeout = require('connect-timeout');
var path = require('path');
var logger = require('morgan');
var cookieParser = require('cookie-parser');

var app = express();
if (process.env.NEW_RELIC_LICENSE_KEY)
  app.locals.newrelic = newrelic;

var bodyParser = require('body-parser');

// set timeout
app.use(timeout(process.env.TIMEOUT || '12s'));
app.set('view engine', 'pug');

var accountRoutes = require('./routes/account');
var index = require('./routes/index');
var authRoutes = require('./routes/auth');
var apiRoutes = require('./routes/api');

app.use(express.static(path.join(__dirname, 'public')));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// set strong params
app.use(params.expressMiddleware());
app.use(cookieParser());

var sessionStore = new MongoStore({ url: dbURI });
var secret_key = process.env.SECRET_KEY || 'xXxXxXxXxX';

app.use(session({
  secret: secret_key,
  name: 'voxbone-generator',
  resave: true,
  saveUninitialized: false,
  store: sessionStore
}));

app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

// set some default variables to be accessed in views
app.use(function (req, res, next) {
  // if (!req.cookies.referrer_url) {
  //   var referrer_url = req.headers.referer || req.headers.referrer;
  //   if (referrer_url)
  //     res.cookie('referrer_url', referrer_url, { maxAge: 900000 });
  //   console.log('Cookie referrer_url: ', referrer_url);
  // }

  res.locals.currentUser = req.user || {};
  res.locals.authenticated = !!req.user;

  if(res.locals.authenticated) {
    res.locals.currentUser.gravatar = utils.userGravatarUrl(res);
  }

  next();
});

app.use('/', index);
app.use('/account', accountRoutes);
app.use('/auth', authRoutes);
app.use('/api', apiRoutes);

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      title: title,
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});

module.exports = app;
