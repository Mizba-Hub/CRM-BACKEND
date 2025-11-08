const express = require("express");
const router = express.Router();
const multer = require("multer");
const attachmentController = require("../../controllers/activity/attachmentController");

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname),
});

const upload = multer({ storage });

router
  .route("/")
  .post(upload.single("file"), attachmentController.createAttachment)
  .get(attachmentController.getAttachmentsByLinked);

router
  .route("/:id")
  .get(attachmentController.getAttachment)
  .delete(attachmentController.deleteAttachment);

module.exports = router;
