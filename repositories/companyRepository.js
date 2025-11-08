
const { Op } = require("sequelize");
const Company = require("../models/company");
const User    = require("../models/user");
const Lead    = require("../models/lead");

const findAllCompanies = async (query) => {
  const { search, page = 1, size = 10 } = query;
  const where = {};

  if (search) {
    
    const normSearch = search.startsWith('+') ? search.slice(1) : search;

    where[Op.or] = [
      { companyName : { [Op.iLike]: `%${normSearch}%` } },
      { domainName  : { [Op.iLike]: `%${normSearch}%` } },
      { industryType: { [Op.iLike]: `%${normSearch}%` } },
      { city        : { [Op.iLike]: `%${normSearch}%` } },
      { country     : { [Op.iLike]: `%${normSearch}%` } },
      { phoneNumber : { [Op.iLike]: `%${normSearch}%` } },                   
      { '$Lead.phoneNumber$': { [Op.iLike]: `%${normSearch}%` } }            
    ];
  }

  const companies = await Company.findAll({
    where,
    include: [
      {
        model     : User,
        as        : "Owners",
        attributes: ["id", "firstName", "lastName"],
        through   : { attributes: [] }
      },
      {
        model     : Lead,
        as        : "Lead",
        attributes: ["id", "phoneNumber"],
        required  : false
      },
    ],
    limit : parseInt(size, 10),
    offset: (parseInt(page, 10) - 1) * parseInt(size, 10),
    order : [["createdAt", "DESC"]],
    subQuery: false
  });

  return companies.map((c) => {
    const plain = c.get({ plain: true });
    
    plain.phoneNumber = plain.phoneNumber || plain.Lead?.phoneNumber || null;
    delete plain.Lead;
    return plain;
  });
};

const findCompanyById = async (id) => {
  const company = await Company.findByPk(id, {
    include: [
      {
        model     : User,
        as        : "Owners",
        attributes: ["id", "firstName", "lastName"],
        through   : { attributes: [] }
      },
      {
        model     : Lead,
        as        : "Lead",
        attributes: ["id", "phoneNumber"],
      },
    ],
  });

  if (!company) return null;

  const plain = company.get({ plain: true });
  plain.phoneNumber = plain.phoneNumber || plain.Lead?.phoneNumber || null;
  delete plain.Lead;

  return plain;
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
  findCompanyByName,
  createCompany,
  updateCompany,
  deleteCompany,
};
