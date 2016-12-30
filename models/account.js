var mongoose = require('mongoose');
var moment = require('moment');
var Schema = mongoose.Schema;
var bcrypt = require('bcrypt-nodejs');
var utils = require('../routes/utils');

var accountSchema = new Schema({
  email: {
    type: String,
    required: true,
    index: {
      unique: true
    }
  },
  temporary_password: String,
  first_name: {
    type: String,
    required: true
  },
  last_name: {
    type: String,
    required: false
  },
  temporary: {
    type: Boolean,
    default: true
  },
  verified: {
    type: Boolean,
    default: false
  },
  admin: {
    type: Boolean,
    default: false
  },
  forgotten_pasword: String,
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  verifyAccountToken: String,
  verifyAccountExpires: Date,
  password: String,
  created_at: Date,
  updated_at: Date,
  company: String,
  phone: String,
  create_date: String,
  google_id: String,
  google_token: String,
  github_id: String,
  github_token: String,
  windowslive_token: String,
  windowslive_id: String,
  slack_token: String,
  slack_id: String,
  linkedin_token: String,
  linkedin_id: String,
  voxbone_token: String,
  voxbone_id: String,
  referrer: String,
  apiBrowsername: String,
  ringtone: {
    type: String,
    default: "office"
  },
});

accountSchema.pre('save', function (next) {
  self = this;
  now = new Date();
  self.updated_at = now;

  if (!self.created_at) {
    self.created_at = now;
    self.create_date = moment().format("DD/MM/YYYY");
  }

  if (!self.apiBrowsername) {
    console.log('Creating User for ' + self.email + '!');
    utils.createUser(self, utils.haiku(), function(){
      next();
    });
  } else {
    next();
  }

});

accountSchema.methods.generateHash = function (password) {
  return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
};

accountSchema.methods.validPassword = function (password) {
  return bcrypt.compareSync(password, this.password);
};

accountSchema.methods.getFullName = function () {
  return this.first_name + ' ' + this.last_name;
};

var Account = mongoose.model('Account', accountSchema);

module.exports = Account;
