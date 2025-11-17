const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/authMiddleware");
const adminMiddleware = require("../middlewares/adminMiddleware");
const { getDashboardData } = require("../controllers/dashboardController");

router.get("/", authMiddleware, adminMiddleware, getDashboardData);

module.exports = router;
