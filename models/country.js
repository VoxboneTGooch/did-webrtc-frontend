var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var countrySchema = new Schema({
  countryCodeA3: String,
  countryName: String,
  phoneCode: String,
  hasStates: Boolean,
  hasRegulationRequirement: Boolean,
  created_at: Date,
  updated_at: Date
});

countrySchema.pre('save', function(next){
  now = new Date();
  this.updated_at = now;
  if (!this.created_at) this.created_at = now;
  next();
});

var Country = mongoose.model('Country', countrySchema);

module.exports = Country;
