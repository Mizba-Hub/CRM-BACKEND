const Lead = require("../models/lead");
const User = require("../models/user");
const { Op } = require("sequelize");

const getLeads = async (req, res) => {
  try {
    const { status, search, page = 1, size = 10 } = req.query;

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

    const leads = await Lead.findAll({
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

    res.json(leads);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getLeadById = async (req, res) => {
  try {
    const { id } = req.params;
    const lead = await Lead.findByPk(id, {
      include: [
        {
          model: User,
          as: "ContactOwner",
          attributes: ["id", "firstName", "lastName", "email"],
        },
      ],
    });

    if (!lead) return res.status(404).json({ message: "Lead not found" });

    res.json(lead);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const createLead = async (req, res) => {
  try {
    const {
      email,
      firstName,
      lastName,
      phoneNumber,
      jobTitle,
      leadStatus,
      ContactOwnerId,
    } = req.body;

    const existingLead = await Lead.findOne({ where: { email } });
    if (existingLead)
      return res.status(400).json({ message: "Lead already exists" });

    const lead = await Lead.create({
      email,
      firstName,
      lastName,
      phoneNumber,
      jobTitle,
      leadStatus,
      ContactOwnerId,
    });

    res.status(201).json({ id: lead.id });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const updateLead = async (req, res) => {
  try {
    const { id } = req.params;
    const lead = await Lead.findByPk(id);
    if (!lead) return res.status(404).json({ message: "Lead not found" });

    await lead.update(req.body);
    res.json({ id: lead.id, updatedAt: new Date() });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const deleteLead = async (req, res) => {
  try {
    const { id } = req.params;
    const lead = await Lead.findByPk(id);
    if (!lead) return res.status(404).json({ message: "Lead not found" });

    await lead.destroy();
    res.json({ deleted: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getLeads, getLeadById, createLead, updateLead, deleteLead };
