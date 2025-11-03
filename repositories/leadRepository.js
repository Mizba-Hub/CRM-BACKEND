const Lead = require("../models/lead");
const User = require("../models/user");
const { Op } = require("sequelize");

const findAllLeads = async ({ status, search, page = 1, size = 10 }) => {
  const where = {};

  if (status) where.leadStatus = { [Op.in]: status.split(",") };

  if (search) {
    where[Op.or] = [
      { firstName: { [Op.iLike]: `%${search}%` } },
      { lastName: { [Op.iLike]: `%${search}%` } },
      { email: { [Op.iLike]: `%${search}%` } },
      { phoneNumber: { [Op.iLike]: `%${search}%` } },
    ];
  }

  return Lead.findAll({
    where,
    include: [
      {
        model: User,
        as: "ContactOwner",
        attributes: ["id", "firstName", "lastName", "email"],
      },
    ],
    limit: parseInt(size),
    offset: (parseInt(page) - 1) * parseInt(size),
    order: [["createdAt", "DESC"]],
  });
};

const findLeadById = async (id) => {
  return Lead.findByPk(id, {
    include: [
      {
        model: User,
        as: "ContactOwner",
        attributes: ["id", "firstName", "lastName", "email"],
      },
    ],
  });
};

const createLead = async (data) => {
  return Lead.create(data);
};

const updateLead = async (lead, data) => {
  return lead.update(data);
};

const deleteLead = async (lead) => {
  return lead.destroy();
};

const findLeadByEmail = async (email) => {
  return Lead.findOne({ where: { email } });
};

module.exports = {
  findAllLeads,
  findLeadById,
  createLead,
  updateLead,
  deleteLead,
  findLeadByEmail,
};
