const express = require('express');
const router = express.Router();
const widgetController = require('../controllers/widgetController');

router.get('/categories', widgetController.getCategories);
router.post('/categories', widgetController.addCategory);

router.get('/subcategories/:category', widgetController.getSubcategories);
router.post('/subcategories', widgetController.addSubcategory);

router.get('/widgets', widgetController.getWidgets);
router.post('/widgets', widgetController.addWidget);

router.put('/widgets/:id', widgetController.editWidget);
router.patch('/widgets/:id/status', widgetController.toggleWidgetStatus);

// User widget selection
router.get('/userWidgets', widgetController.getUserWidgets); // GET?userEmail=...
router.post('/userWidgets', widgetController.addUserWidget); // POST { userEmail, widgetName, widgetId }
router.delete('/userWidgets', widgetController.removeUserWidget); // DELETE { userEmail, widgetName }
module.exports = router;
