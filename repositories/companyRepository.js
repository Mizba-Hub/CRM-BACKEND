const { Op } = require("sequelize");
const Company = require("../models/company");
const User = require("../models/user");
const Lead = require("../models/lead");

const findAllCompanies = async (query) => {
  const { search, page = 1, size = 10 } = query;
  const where = {};

  if (search) {
    where[Op.or] = [
      { companyName: { [Op.iLike]: `%${search}%` } },
      { domainName: { [Op.iLike]: `%${search}%` } },
      { industryType: { [Op.iLike]: `%${search}%` } },
      { city: { [Op.iLike]: `%${search}%` } },
      { country: { [Op.iLike]: `%${search}%` } },
    ];
  }

  const companies = await Company.findAll({
    where,
    include: [
      {
        model: User,
        as: "Owners",
        attributes: ["id", "firstName", "lastName"],
        through: { attributes: [] },
      },
      {
        model: Lead,
        as: "Lead",
        attributes: ["id", "phoneNumber"],
      },
    ],
    limit: parseInt(size),
    offset: (parseInt(page) - 1) * parseInt(size),
    order: [["createdAt", "DESC"]],
  });

  return companies.map((c) => {
    const plain = c.get({ plain: true });
    plain.phoneNumber = plain.Lead?.phoneNumber || null;
    delete plain.Lead;
    return plain;
  });
};

const findCompanyById = async (id) => {
  const company = await Company.findByPk(id, {
    include: [
      {
        model: User,
        as: "Owners",
        attributes: ["id", "firstName", "lastName"],
        through: { attributes: [] },
      },
      {
        model: Lead,
        as: "Lead",
        attributes: ["id", "phoneNumber"],
      },
    ],
  });

  if (!company) return null;

  const plain = company.get({ plain: true });
  plain.phoneNumber = plain.Lead?.phoneNumber || null;
  delete plain.Lead;

  return plain;
};

const findCompanyByIdInstance = async (id) => {
  return await Company.findByPk(id);
};

const findCompanyByName = async (companyName) => {
  return await Company.findOne({ where: { companyName } });
};

const createCompany = async (data) => {
  const company = await Company.create(data);
  return company;
};

const updateCompany = async (company, data) => {
  await company.update(data);
  return company;
};

const deleteCompany = async (company) => {
  await company.destroy();
  return true;
};

module.exports = {
  findAllCompanies,
  findCompanyById,
  findCompanyByIdInstance,
  findCompanyByName,
  createCompany,
  updateCompany,
  deleteCompany,
};
