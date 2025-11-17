const attachmentRepo = require("../../repositories/activity/attachmentRepository");

const createAttachment = async (req, res) => {
  try {
    const { uploadedById, linkedType, linkedId } = req.body;

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: "At least one file is required" });
    }

    const totalSize = req.files.reduce((acc, file) => acc + file.size, 0);
    const MAX_TOTAL_SIZE = 20 * 1024 * 1024;
    if (totalSize > MAX_TOTAL_SIZE) {
      return res.status(400).json({ message: "Total file size exceeds 20 MB" });
    }

    const attachments = await Promise.all(
      req.files.map((file) =>
        attachmentRepo.createAttachment({
          filename: file.originalname,
          fileUrl: file.path,
          frontendUrl: `${req.protocol}://${req.get("host")}/${file.path}`,
          uploadedById,
          linkedType,
          linkedId,
        })
      )
    );

    res
      .status(201)
      .json({ message: "Files uploaded successfully", attachments });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

const getAttachments = async (req, res) => {
  try {
    const { linkedType, linkedId } = req.query;

    let attachments;

    if (linkedType && linkedId) {
      attachments = await attachmentRepo.getAttachmentsByLinked(
        linkedType,
        linkedId
      );
    } else {
      attachments = await attachmentRepo.getAllAttachments();
    }

    res.json(attachments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getAttachment = async (req, res) => {
  try {
    const { id } = req.params;
    const attachment = await attachmentRepo.getAttachmentById(id);
    if (!attachment)
      return res.status(404).json({ message: "Attachment not found" });

    res.json(attachment);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const deleteAttachment = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await attachmentRepo.deleteAttachment(id);
    if (!deleted)
      return res.status(404).json({ message: "Attachment not found" });

    res.json({ success: true, message: "Attachment deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  createAttachment,
  getAttachments,
  getAttachment,
  deleteAttachment,
};
