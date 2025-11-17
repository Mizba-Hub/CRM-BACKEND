const express = require("express");
const router = express.Router();
const activityController = require("../../controllers/activity/activitySummaryController");

router.get("/", activityController.getActivitySummary);

module.exports = router;
