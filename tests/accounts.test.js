module.exports = {
  'Login and Edit User' : function (browser) {
    browser
      .url(browser.launchUrl + "/account/login")
      .waitForElementVisible('body', 1000)
      .assert.title('VoxConf.me by Voxbone')
      .assert.containsText('body', 'VOXCONF.ME')
      .setValue('input[name=uemail]', 'demo.user@voxconf.me')
      .setValue('input[name=upassword]', 'password')
      .click('button[id="login"]')
      .pause(1000)
      .url(browser.launchUrl + "/account/edit")
      .waitForElementVisible('body', 1000)
      .clearValue('input[name=first_name]')
      .clearValue('input[name=last_name]')
      .clearValue('input[name=company]')
      .clearValue('input[name=phone]')
      .setValue('input[name=first_name]', 'Demo')
      .setValue('input[name=last_name]', 'User')
      .setValue('input[name=company]', 'Voxbone')
      .setValue('input[name=phone]', '+5412345678')
      .click('button[id="save"]')
      .waitForElementVisible('body', 1000)
      .assert.containsText('#alert', 'Your profile has been saved succesfully')
      .assert.value("form#editProfile input[name=first_name]", "Demo")
      .assert.value("form#editProfile input[name=last_name]", "User")
      .assert.value("form#editProfile input[name=company]", "Voxbone")
      .assert.value("form#editProfile input[name=phone]", "+5412345678")
      .end();
  },
  'Failed Login' : function (browser) {
      browser
        .url(browser.launchUrl + "/account/login")
        .waitForElementVisible('body', 1000)
        .setValue('input[name=uemail]', 'demo.user@voxconf.me')
        .setValue('input[name=upassword]', 'wrong-password')
        .click('button[id="login"]')
        .pause(1000)
        .waitForElementVisible('body', 1000)
        .assert.containsText('#alert-user-pass', 'Incorrect Email or Password, try again.')
        .end();
  }
};
