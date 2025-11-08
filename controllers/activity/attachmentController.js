const attachmentRepo = require("../../repositories/activity/attachmentRepository");

const createAttachment = async (req, res) => {
  try {
    const { filename, fileUrl, uploadedById, linkedType, linkedId } = req.body;

    const attachment = await attachmentRepo.createAttachment({
      filename,
      fileUrl,
      uploadedById,
      linkedType,
      linkedId,
    });

    const result = await attachmentRepo.getAttachmentById(attachment.id);

    res.status(201).json(result);
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

const getAttachmentsByLinked = async (req, res) => {
  try {
    const { linkedType, linkedId } = req.query;
    const attachments = await attachmentRepo.getAttachmentsByLinked(
      linkedType,
      linkedId
    );
    res.json(attachments);
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
  getAttachment,
  getAttachmentsByLinked,
  deleteAttachment,
};
