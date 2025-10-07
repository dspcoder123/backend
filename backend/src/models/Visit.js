const mongoose = require('mongoose');

const VisitSchema = new mongoose.Schema(
  {
    ipAddress: { type: String, index: true },
    path: { type: String },
    userAgent: { type: String },
    referer: { type: String },
  },
  { timestamps: true, collection: 'visits' }
);

module.exports = mongoose.model('Visit', VisitSchema);


