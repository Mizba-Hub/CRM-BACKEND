const express = require("express");
const router = express.Router();
const meetingController = require("../../controllers/activity/meetingController");

router.get("/", meetingController.getMeetings);

router.get("/:id", meetingController.getMeetingById);

router.post("/", meetingController.createMeeting);

router.put("/:id", meetingController.updateMeeting);

router.delete("/:id", meetingController.deleteMeeting);

router.get("/user/:userId", meetingController.getMeetingsByUser);



module.exports = router;
