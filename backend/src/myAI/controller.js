const mongoose = require('mongoose');

const WidgetCollection = mongoose.connection.collection('Widgets_Data');

// GET all visit names for dropdown
const fetchVisitNames = async (req, res) => {
  try {
    const widgets = await WidgetCollection.find({}).toArray();
    
    const visitNames = widgets
      .map(w => w.visitName || w.widgetName)
      .filter(Boolean);

    res.json({ success: true, data: visitNames });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error fetching visit names' });
  }
};

module.exports = { fetchVisitNames };
