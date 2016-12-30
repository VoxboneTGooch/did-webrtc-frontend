require.config({
  baseUrl: '/javascripts/',
  shim: {
    bootstrap: {
      deps: ['jquery']
    },
    angular: {
      exports: 'angular'
    },
    moment: {
      exports: 'moment'
    },
    'angular-cookies': {
      deps: ['angular'], init: function () {
        return 'ngCookies';
      }
    },
    'angular-recaptcha': {
      deps: ['angular'], init: function () {
        return 'vcRecaptcha';
      }
    },
    'angular-sanitize': {
      deps: ['angular'], init: function () {
        return 'ngSanitize';
      }
    },
    'angular-moment': {
      deps: ['angular', 'moment'], init: function () {
        return 'angularMoment';
      }
    },
  },
  paths: {
    angular: [
      '//ajax.googleapis.com/ajax/libs/angularjs/1.5.8/angular.min',
      '/lib/angular/angular.min'
    ],
    'angular-cookies': [
      '//ajax.googleapis.com/ajax/libs/angularjs/1.5.8/angular-cookies.min',
      '/lib/angular-cookies/angular-cookies.min'
    ],
    'angular-recaptcha': [
      '//cdnjs.cloudflare.com/ajax/libs/angular-recaptcha/3.0.4/angular-recaptcha.min',
      '/lib/angular-recaptcha/release/angular-recaptcha.min'
    ],
    'angular-sanitize': [
      '//ajax.googleapis.com/ajax/libs/angularjs/1.5.8/angular-sanitize.min',
      '/lib/angular-sanitize/angular-sanitize.min'
    ],
    'angular-moment': [
      '//cdnjs.cloudflare.com/ajax/libs/angular-moment/1.0.0/angular-moment.min',
      '/lib/angular-moment/angular-moment.min'
    ],
    moment: [
      '//cdnjs.cloudflare.com/ajax/libs/moment.js/2.15.2/moment.min',
      '/lib/moment/min/moment.min'
    ],
    bootstrap: [
      '//maxcdn.bootstrapcdn.com/bootstrap/3.3.7/js/bootstrap.min',
      '/lib/bootstrap/dist/js/bootstrap.min'
    ],
    click2vox: 'https://voxbone.com/click2vox/click2vox',
    jquery: [
      '//code.jquery.com/jquery-2.2.4.min',
      '/lib/jquery/dist/jquery.min'
    ],
    'jquery.qtip': [
      '//cdn.jsdelivr.net/qtip2/2.2.1/jquery.qtip.min',
      '/lib/qtip2/basic/jquery.qtip.min'
    ],
    jqueryMask: [
      '//cdnjs.cloudflare.com/ajax/libs/jquery.mask/1.14.0/jquery.mask.min',
      '/lib/jquery-mask/dist/jquery.mask.min'
    ],
    underscore: [
      '//cdnjs.cloudflare.com/ajax/libs/underscore.js/1.8.3/underscore-min',
      '/lib/underscore/underscore-min'
    ],
    domReady: [
      '//cdnjs.cloudflare.com/ajax/libs/require-domReady/2.0.1/domReady.min',
      '/lib/domReady/domReady'
    ],
    requirejs: [
      '//cdnjs.cloudflare.com/ajax/libs/require.js/2.3.2/require.min',
      '/lib/requirejs/require'
    ]
  },
  packages: [
    "controllers",
    "directives"
  ]
});

// this is just to "preload" stuff
require(['angular', 'jquery']);
