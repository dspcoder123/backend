const express = require("express");
const router = express.Router();
const { getLastVisits, getVisitById } = require("./controller");

// Get last 20 visits
router.get("/", getLastVisits);

// Get visit by ID
router.get("/:id", getVisitById);

module.exports = router;
    