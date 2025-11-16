const mongoose = require('mongoose');

const UserWidgetSchema = new mongoose.Schema({
  userEmail: { type: String, required: true, unique: true, index: true },
  widgets: [
    {
      widgetName: { type: String, required: true },
      widgetId: { type: mongoose.Schema.Types.ObjectId, ref: 'Widget' },
      addedAt: { type: Date, default: Date.now },
    }
  ]
});

module.exports = mongoose.model('UserWidget', UserWidgetSchema);
