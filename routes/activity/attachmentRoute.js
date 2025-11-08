const express = require("express");
const router = express.Router();
const attachmentController = require("../../controllers/activity/attachmentController");

router
  .route("/")
  .post(attachmentController.createAttachment)
  .get(attachmentController.getAttachmentsByLinked);

router
  .route("/:id")
  .get(attachmentController.getAttachment)
  .delete(attachmentController.deleteAttachment);

module.exports = router;
