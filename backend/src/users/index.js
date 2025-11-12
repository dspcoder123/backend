const express = require("express");
const router = express.Router();
const { getAllUsers, getUserById } = require("./controller");

// Get all users
router.get("/", getAllUsers);

// Get user by ID
router.get("/:id", getUserById);

module.exports = router;
