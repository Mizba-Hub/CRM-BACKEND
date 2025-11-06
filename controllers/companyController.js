const asyncHandler = require("express-async-handler");
const companyRepo = require("../repositories/companyRepository");
const CustomError = require("../utils/customError");
const Lead = require("../models/lead");

const getCompanies = asyncHandler(async (req, res) => {
  const companies = await companyRepo.findAllCompanies(req.query);
  res.status(200).json(companies);
});

const getCompanyById = asyncHandler(async (req, res) => {
  const company = await companyRepo.findCompanyById(req.params.id);
  if (!company)
    throw new CustomError(
      `Company with id ${req.params.id} not found`,
      404,
      "COMPANY_NOT_FOUND"
    );

  res.status(200).json(company);
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

  let phoneNumber = null;
  if (leadId) {
    const lead = await Lead.findByPk(leadId);
    if (lead) phoneNumber = lead.phoneNumber;
  }

  const company = await companyRepo.createCompany({
    ...data,
    leadId,
    phoneNumber,
  });

  if (ownerIds.length) {
    await company.setOwners(ownerIds);
  }

  res.status(201).json({ id: company.id });
});

const updateCompany = asyncHandler(async (req, res) => {
  const { ownerIds, leadId, ...updateData } = req.body;

  const company = await companyRepo.findCompanyByIdInstance(req.params.id);
  if (!company)
    throw new CustomError(
      `Company with id ${req.params.id} not found`,
      404,
      "COMPANY_NOT_FOUND"
    );

  await companyRepo.updateCompany(company, { ...updateData, leadId });
  if (ownerIds && ownerIds.length) await company.setOwners(ownerIds);

  res.status(200).json({ id: company.id, updatedAt: new Date().toISOString() });
});

const deleteCompany = asyncHandler(async (req, res) => {
  const company = await companyRepo.findCompanyByIdInstance(req.params.id);
  if (!company)
    throw new CustomError(
      `Company with id ${req.params.id} not found`,
      404,
      "COMPANY_NOT_FOUND"
    );

  await companyRepo.deleteCompany(company);
  res.status(200).json({ deleted: true });
});

module.exports = {
  getCompanies,
  getCompanyById,
  createCompany,
  updateCompany,
  deleteCompany,
};
