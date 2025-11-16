const mongoose = require('mongoose');

const WidgetSchema = new mongoose.Schema({
    visitId: { type: Number, required: true, unique: true },
    visitCategory: { type: String, required: true },
    visitName: { type: String, required: true },
    widgetName: { type: String, required: true },
    widgetVendor: { type: String },
    widgetPaidOrFree: { type: String, enum: ['paid', 'free'], required: true },
    visitCostPerUnit: { type: Number, default: 0 },
    visitUnit: { type: String, default: null },
    visitAgeLimit: { type: Number, default: 0 },
    visitStatus: { type: String, enum: ['active', 'inactive'], default: 'active' },
    createdAt: { type: Date, default: Date.now }
  });
  
module.exports = mongoose.model('Widget', WidgetSchema);
