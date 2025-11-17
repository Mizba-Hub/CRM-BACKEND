const express = require("express");
const router = express.Router();
const attachmentController = require("../../controllers/activity/attachmentController");
const upload = require("../../middlewares/uploadMidlleware");

router
  .route("/")
  .post(upload.array("files"), attachmentController.createAttachment)
  .get(attachmentController.getAttachments);

router
  .route("/:id")
  .get(attachmentController.getAttachment)
  .delete(attachmentController.deleteAttachment);

module.exports = router;
