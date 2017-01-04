var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var demoSchema = new Schema({
  name: String,
  sip: String,
  widget_id: String,
  created_at: Date,
  updated_at: Date,
  dids: {
    type: [Schema.Types.Mixed],
    default: []
  }
});

demoSchema.pre('save', function(next){
  now = new Date();
  this.updated_at = now;
  if (!this.created_at) this.created_at = now;
  next();
});

var Demo = mongoose.model('Demo', demoSchema);

module.exports = Demo;
