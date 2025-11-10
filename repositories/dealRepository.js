const { Op } = require("sequelize");
const Deal = require("../models/deal");
const Lead = require("../models/lead");
const User = require("../models/user");
const findAllDeals = async (query = {}) => {
  const { stage, search, page = 1, size = 10 } = query;
  const limit = parseInt(size);
  const offset = (parseInt(page) - 1) * limit;

  const where = {};
  if (stage) where.dealStage = { [Op.in]: stage.split(",") };

  if (search) {
    where[Op.or] = [
      { dealName: { [Op.iLike]: `%${search}%` } },
      { "$associatedLead.firstName$": { [Op.iLike]: `%${search}%` } },
      { "$associatedLead.lastName$": { [Op.iLike]: `%${search}%` } },
    ];
  }

  return await Deal.findAll({
    where,
    include: [
      {
        model: User,
        as: "dealOwner",
        attributes: ["id", "firstName", "lastName", "email"],
        through: { attributes: [] },
      },
      {
        model: Lead,
        as: "associatedLead",
        attributes: ["id", "firstName", "lastName", "email", "leadStatus"],
      },
    ],
    limit,
    offset,
    order: [["createdAt", "DESC"]],
  });
};
const findDealById = async (id) => {
  return await Deal.findByPk(id, {
    include: [
      {
        model: User,
        as: "dealOwner",
        attributes: ["id", "firstName", "lastName", "email"],
        through: { attributes: [] },
      },
      {
        model: Lead,
        as: "associatedLead",
        attributes: ["id", "firstName", "lastName", "email", "leadStatus"],
      },
    ],
  });
};
const createDeal = async (dealData) => {
  return await Deal.create(dealData);
};
const updateDeal = async (deal, updateData) => {
  return await deal.update(updateData);
};
const deleteDeal = async (deal) => {
  return await deal.destroy();
};

module.exports = {
  findAllDeals,
  findDealById,
  createDeal,
  updateDeal,
  deleteDeal,
};
