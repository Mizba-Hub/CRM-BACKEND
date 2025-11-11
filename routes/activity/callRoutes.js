// const express = require("express");
// const callController = require("../../controllers/activity/callController");

// const router = express.Router();

// router.post("/", callController.initiateCall);
// router.get("/:callId", callController.getCallById);
// router.delete("/:callId", callController.endCall);

// module.exports = router;



const express = require("express");

const router = express.Router();

const {
  initiateCall,
  getCallById,
  endCall,
} = require("../../controllers/activity/callController");

router.route("/").post(initiateCall);

router.route("/:callId").get(getCallById).delete(endCall);

module.exports = router;
