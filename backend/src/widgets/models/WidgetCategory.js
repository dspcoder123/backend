const mongoose = require('mongoose');

const WidgetCategorySchema = new mongoose.Schema({
  visitCategory: { type: String, required: true, unique: true },
  description: { type: String },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('WidgetCategory', WidgetCategorySchema);
