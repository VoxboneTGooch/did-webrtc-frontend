var expect = require('chai').expect;
var utils = require('../../../routes/utils');

describe('Utils module', function() {
  describe('#apiCredentials', function() {
    var apiCredentials = utils.provisioningApiCredentials;

    it('should have user and pass attributes both strings', function() {
      expect(apiCredentials).to.have.property('user').to.be.a('string');
      expect(apiCredentials).to.have.property('pass').to.be.a('string');
    });
  });

  describe('#jsonHeaders', function() {
    var jsonHeaders = utils.provisioningApiHeaders;

    it('should have `Content-type` attribute and be equal to `application/json`', function() {
      expect(jsonHeaders).to.have.property('Content-type').to.be.equal('application/json');
    });

    it('should have `Accept` attribute and be equal to `application/json`', function() {
      expect(jsonHeaders).to.have.property('Accept').to.be.equal('application/json');
    });
  });

  describe('#accountLoggedIn(req)', function() {
    it('should return true if user logged in', function() {
      // let's mock a bit the req object send as parameter
      // TODO: add a mocking library into the project
      var req = {
        isAuthenticated: function() {
          return true;
        }
      };

      expect(utils.accountLoggedIn(req)).be.equal(true);
    });
  });

  describe('#uuid4()', function() {
    // pending to complete tests
    it('should return an uuid4 string', function() {
      var uuid4Regex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      expect(utils.uuid4()).to.match(uuid4Regex);
    });

    it('should return a string with a length of 36', function() {
      expect(utils.uuid4()).to.be.a('string').have.length(36);
    });
  });

  describe('#userGravatar()', function() {
    var res = { locals: { currentUser: { email: 'email@server.com' } } };
    var userGravatarUrl = utils.userGravatarUrl(res);

    it('should return a gravatar url for the current logged in user from his email', function() {
      var expectedUrl = "https://www.gravatar.com/avatar/a936272820dd1f98ae006db253a43b4e/?s=20&d=mm";
      expect(userGravatarUrl).to.be.an('String');
      expect(userGravatarUrl).be.equal(expectedUrl);
    });
  });

  describe('#getUnsupportedBrowsers()', function() {
    var unsupportedBrowsers = utils.getUnsupportedBrowsers();

    it('should return the list of unsupported browsers', function() {
      var expectedArray = ['IE', 'Safari'];
      expect(unsupportedBrowsers).to.be.an('Array');
      expect(unsupportedBrowsers).be.eql(expectedArray);
    });
  });

  describe('#isSupportedBrowser()', function() {
    it('should detect an supported browser', function() {
      ['Chrome', 'Mobile Chrome', 'Firefox', 'Opera'].forEach(function (x) {
        expect(utils.isSupportedBrowser(x)).be.eql(true);
      });
    });

    it('should detect an unsupported browser', function() {
      ['Safari', 'Mobile Safari', 'IE', '', null].forEach(function (x) {
        expect(utils.isSupportedBrowser(x)).be.eql(false);
      });
    });
  });

});
