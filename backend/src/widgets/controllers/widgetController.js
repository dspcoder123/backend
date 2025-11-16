const Widget = require('../models/Widget');
const WidgetCategory = require('../models/WidgetCategory');
const WidgetSubCategory = require('../models/WidgetSubCategory');
const UserWidget = require('../models/UserWidget');

// Get all widget categories
exports.getCategories = async (req, res) => {
  try {
    const categories = await WidgetCategory.find();
    res.json(categories);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Add category
exports.addCategory = async (req, res) => {
  try {
    const newCat = new WidgetCategory(req.body);
    await newCat.save();
    res.json(newCat);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Get subcategories by category
exports.getSubcategories = async (req, res) => {
  try {
    const subcats = await WidgetSubCategory.find({ visitCategory: req.params.category });
    res.json(subcats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Add subcategory
exports.addSubcategory = async (req, res) => {
  try {
    const newSubcat = new WidgetSubCategory(req.body);
    await newSubcat.save();
    res.json(newSubcat);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Get widgets by category and/or subcategory
exports.getWidgets = async (req, res) => {
  try {
    const filter = {};
    if (req.query.category) filter.visitCategory = req.query.category;
    if (req.query.subCategory) filter.visitSubCategory = req.query.subCategory;
    if (req.query.status) filter.visitStatus = req.query.status;
    const widgets = await Widget.find(filter);
    res.json(widgets);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Add widget
exports.addWidget = async (req, res) => {
    console.log("Received widget payload:", req.body);
  try {
    const newWidget = new Widget(req.body);
    await newWidget.save();
    res.json(newWidget);
  } catch (err) {
    console.error("Widget creation error:", err); 
    res.status(400).json({ error: err.message });
  }
};

// Edit widget
exports.editWidget = async (req, res) => {
  try {
    const updated = await Widget.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Toggle widget status (active/inactive)
exports.toggleWidgetStatus = async (req, res) => {
  try {
    const widget = await Widget.findById(req.params.id);
    if (!widget) return res.status(404).json({ error: "Not found" });
    widget.visitStatus = req.body.visitStatus;
    await widget.save();
    res.json(widget);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};





// Get all widgets selected by a user
exports.getUserWidgets = async (req, res) => {
  try {
    const { userEmail } = req.query;
    if (!userEmail) return res.status(400).json({ error: "Missing userEmail" });
    const doc = await UserWidget.findOne({ userEmail });
    res.json(doc ? doc.widgets : []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Add a widget to user's selection (array push, avoid duplicates)
exports.addUserWidget = async (req, res) => {
  try {
    const { userEmail, widgetName, widgetId } = req.body;
    if (!userEmail || !widgetName) return res.status(400).json({ error: "Missing fields" });
    let userDoc = await UserWidget.findOne({ userEmail });
    if (!userDoc) {
      userDoc = new UserWidget({ userEmail, widgets: [{ widgetName, widgetId }] });
    } else if (!userDoc.widgets.some(w => w.widgetName === widgetName)) {
      userDoc.widgets.push({ widgetName, widgetId });
    }
    await userDoc.save();
    res.json(userDoc.widgets);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Remove a widget from user's selection (by widgetName)
exports.removeUserWidget = async (req, res) => {
  try {
    const { userEmail, widgetName } = req.body;
    if (!userEmail || !widgetName) return res.status(400).json({ error: "Missing fields" });
    const doc = await UserWidget.findOne({ userEmail });
    if (doc) {
      doc.widgets = doc.widgets.filter(w => w.widgetName !== widgetName);
      await doc.save();
    }
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
