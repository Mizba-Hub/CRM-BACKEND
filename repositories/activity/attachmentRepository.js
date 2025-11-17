const Attachment = require("../../models/activity/attachment");
const User = require("../../models/user");

const createAttachment = async (data) => {
  return await Attachment.create(data);
};

const getAllAttachments = () => {
  return Attachment.findAll();
};

const getAttachmentById = async (id) => {
  return await Attachment.findOne({
    where: { id },
    include: {
      model: User,
      as: "uploadedBy",
      attributes: ["id", "firstName", "lastName"],
    },
  });
};

const getAttachmentsByLinked = async (linkedType, linkedId) => {
  return await Attachment.findAll({
    where: { linkedType, linkedId },
    include: {
      model: User,
      as: "uploadedBy",
      attributes: ["id", "firstName", "lastName"],
    },
  });
};

const deleteAttachment = async (id) => {
  const attachment = await Attachment.findByPk(id);
  if (!attachment) return null;
  await attachment.destroy();
  return true;
};

module.exports = {
  createAttachment,
  getAllAttachments,
  getAttachmentById,
  getAttachmentsByLinked,
  deleteAttachment,
};
