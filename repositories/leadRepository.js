const Lead = require("../models/lead");
const User = require("../models/user");
const { Op } = require("sequelize");

const findAllLeads = async (query) => {
  const { status, search, page = 1, size = 10 } = query;

  const where = {};

  if (status) {
    where.leadStatus = { [Op.in]: status.split(",") };
  }

  if (search) {
    where[Op.or] = [
      { firstName: { [Op.iLike]: `%${search}%` } },
      { lastName: { [Op.iLike]: `%${search}%` } },
      { email: { [Op.iLike]: `%${search}%` } },
      { phoneNumber: { [Op.iLike]: `%${search}%` } },
    ];
  }

  const total = await Lead.count({ where });

  const leads = await Lead.findAll({
    where,
    include: [
      {
        model: User,
        as: "Users",
        attributes: ["id", "firstName", "lastName", "email"],
        through: { attributes: [] },
      },
    ],
    limit: parseInt(size),
    offset: (parseInt(page) - 1) * parseInt(size),
    order: [["createdAt", "DESC"]],
  });

  return { leads, total, page: Number(page), size: Number(size) };
};

const findLeadById = async (id) => {
  const lead = await Lead.findByPk(id, {
    include: [
      {
        model: User,
        as: "Users",
        attributes: ["id", "firstName", "lastName", "email"],
        through: { attributes: [] },
      },
    ],
  });

  return lead;
};

const findLeadByEmail = async (email) => {
  return await Lead.findOne({ where: { email } });
};

const createLead = async (data) => {
  const lead = await Lead.create(data);
  return lead;
};

const updateLead = async (lead, data) => {
  await lead.update(data);
  return lead;
};

const deleteLead = async (lead) => {
  await lead.destroy();
  return true;
};

module.exports = {
  findAllLeads,
  findLeadById,
  findLeadByEmail,
  createLead,
  updateLead,
  deleteLead,
};
