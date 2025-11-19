 const { Op } = require("sequelize");
const Company = require("../models/company");
const User = require("../models/user");
const Lead = require("../models/lead");

const findAllCompanies = async (query) => {
  const { search } = query; 
  const where = {};

  if (search) {
    const normSearch = search.startsWith('+') ? search.slice(1) : search;
    where[Op.or] = [
      { companyName: { [Op.iLike]: `%${normSearch}%` } },
      { domainName: { [Op.iLike]: `%${normSearch}%` } },
      { industryType: { [Op.iLike]: `%${normSearch}%` } },
      { city: { [Op.iLike]: `%${normSearch}%` } },
      { country: { [Op.iLike]: `%${normSearch}%` } },
      { phoneNumber: { [Op.iLike]: `%${normSearch}%` } },
      { '$Lead.phoneNumber$': { [Op.iLike]: `%${normSearch}%` } }
    ];
  }

 

  const companies = await Company.findAll({
    where,
    include: [
      {
        model: User,
        as: "Owners",
        attributes: ["id", "firstName", "lastName"],
        through: { attributes: [] }
      },
      {
        model: Lead,
        as: "Lead",
        attributes: ["id", "phoneNumber"],
        required: false
      },
    ],

    order: [["createdAt", "DESC"]],
    subQuery: false
  });

  const result = companies.map((c) => {
    const plain = c.get({ plain: true });
    plain.phoneNumber = plain.phoneNumber || plain.Lead?.phoneNumber || "-";
    plain.createdDate = plain.createdAt || "-";
    delete plain.Lead;
    return plain;
  });

  return result;
};

const findCompanyById = async (id) => {
  const company = await Company.findByPk(id, {
    include: [
      {
        model: User,
        as: "Owners",
        attributes: ["id", "firstName", "lastName"],
        through: { attributes: [] }
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
  plain.phoneNumber = plain.phoneNumber || plain.Lead?.phoneNumber || "-";
  plain.createdDate = plain.createdAt || "-";
  delete plain.Lead;

  return plain;
};

const deleteCompany = async (id) => {
  return await Company.destroy({ where: { id } });
};

const createCompany = async (data) => {
  const company = await Company.create(data);
  return company.get({ plain: true });
};

const updateCompany = async (id, data) => {
  await Company.update(data, { where: { id } });
  const updatedCompany = await findCompanyById(id);
  return updatedCompany;
};

const findCompanyByName = async (companyName) => {
  return await Company.findOne({ where: { companyName } });
};

module.exports = {
  findAllCompanies,
  findCompanyById,
  findCompanyByName,
  createCompany,
  updateCompany,
  deleteCompany,
};