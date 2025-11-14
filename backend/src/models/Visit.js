const mongoose = require('mongoose');

const VisitSchema = new mongoose.Schema(
  {
    ipAddress: { type: String, index: true },
    path: { type: String },
    userAgent: { type: String },
    referer: { type: String },
    location: {
      ip: { type: String },
      version : {type: String },
      city: { type: String },
      region: { type: String },
      region_code : { type : Number},
      country: { type: String },
      country_name : { type : String},
      loc: { type: String }, // latitude,longitude
      currency : {type : String},
      currency_name : {type : String},
      org: { type: String }, // ISP
      timezone: { type: String },
      postal: { type: String }
    }
  },
  { timestamps: true, collection: 'visits' }
);

module.exports = mongoose.model('Visit', VisitSchema);


