const asyncHandler = require("express-async-handler");
const companyRepo = require("../repositories/companyRepository");
const CustomError = require("../utils/customError");
const Lead = require("../models/lead");
const Company = require("../models/company");

const getCompanies = asyncHandler(async (req, res) => {
  
  const companies = await companyRepo.findAllCompanies(req.query);
  res.status(200).json({
    success: true,
    data: companies,
    count: companies.length
  });
});

const getCompanyById = asyncHandler(async (req, res) => {
  const company = await companyRepo.findCompanyById(req.params.id);
  if (!company)
    throw new CustomError(
      `Company with id ${req.params.id} not found`,
      404,
      "COMPANY_NOT_FOUND"
    );

  res.status(200).json({
    success: true,
    data: company
  });
});

const createCompany = asyncHandler(async (req, res) => {
  const { ownerIds = [], leadId, ...data } = req.body;
  const existingCompany = await companyRepo.findCompanyByName(data.companyName);
  if (existingCompany)
    throw new CustomError(
      "Company already exists",
      400,
      "COMPANY_ALREADY_EXISTS"
    );

  let phoneNumber = data.phoneNumber;
  if (leadId && !phoneNumber) {
    const lead = await Lead.findByPk(leadId);
    if (lead) phoneNumber = lead.phoneNumber;
  }

  const company = await companyRepo.createCompany({
    ...data,
    leadId,
    phoneNumber,
  });

  if (ownerIds && ownerIds.length > 0) {
    const companyInstance = await Company.findByPk(company.id);
    await companyInstance.setOwners(ownerIds);
  
  }

  const fullCompany = await companyRepo.findCompanyById(company.id);

  res.status(201).json({ 
    success: true,
    data: fullCompany 
  });
});

const updateCompany = asyncHandler(async (req, res) => {
  const { ownerIds, leadId, ...updateData } = req.body;

  const existingCompany = await companyRepo.findCompanyById(req.params.id);
  if (!existingCompany)
    throw new CustomError(
      `Company with id ${req.params.id} not found`,
      404,
      "COMPANY_NOT_FOUND"
    );

  await companyRepo.updateCompany(req.params.id, { ...updateData, leadId });

  
  if (ownerIds !== undefined) {
 
    const companyInstance = await Company.findByPk(req.params.id);
    await companyInstance.setOwners(ownerIds || []);
  }

  const updatedCompany = await companyRepo.findCompanyById(req.params.id);

  
  res.status(200).json({
    success: true,
    data: updatedCompany
  });
});

const deleteCompany = asyncHandler(async (req, res) => {
  const companyId = parseInt(req.params.id, 10);

  const existingCompany = await companyRepo.findCompanyById(companyId);
  if (!existingCompany)
    throw new CustomError(
      `Company with id ${companyId} not found`,
      404,
      "COMPANY_NOT_FOUND"
    );

  await companyRepo.deleteCompany(companyId);

  res.status(200).json({
    success: true,
    message: "Company deleted successfully",
  });
});

module.exports = {
  getCompanies,
  getCompanyById,
  createCompany,
  updateCompany,
  deleteCompany,
};