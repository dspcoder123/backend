const mongoose = require('mongoose');

const WidgetSubCategorySchema = new mongoose.Schema({
  visitSubCategory: { type: String, required: true },
  visitCategory: { type: String, required: true },
  description: { type: String },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('WidgetSubCategory', WidgetSubCategorySchema);
