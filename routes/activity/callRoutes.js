const express = require("express");
const router = express.Router();
const {
  initiateCall,
  getCallById,
  getCallsByUserId,
  endCall,
} = require("../../controllers/activity/callController");

router.route("/").post(initiateCall);
router.route("/user/:userId").get(getCallsByUserId);

router.route("/:callId").get(getCallById).delete(endCall);

module.exports = router;
