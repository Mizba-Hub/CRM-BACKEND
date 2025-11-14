const express = require("express");
const router = express.Router();
const emailController = require("../../controllers/activity/emailController");
const multer = require("multer");


const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads"),
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname),
});

const upload = multer({ storage });


router.post('/upload-attachments', upload.array('attachments', 5), emailController.uploadAttachments);
router.get('/available-attachments', emailController.getAvailableAttachments);
router.delete('/attachments/:id', emailController.deleteAttachment);


router.get('/', emailController.getEmails);
router.get('/stats', emailController.getEmailStats);
router.get('/:id', emailController.getEmailById);
router.post('/', upload.array('attachments', 5), emailController.createEmail);
router.put('/:id', emailController.updateEmail);
router.delete('/:id', emailController.deleteEmail);

module.exports = router;
