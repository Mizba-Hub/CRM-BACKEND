const asyncHandler = require("express-async-handler");
const leadRepo = require("../repositories/leadRepository");
const CustomError = require("../utils/customError");


const getLeads = asyncHandler(async (req, res) => {
  const leads = await leadRepo.findAllLeads(req.query, req.user);
  res.json({ success: true, data: leads });
});


const getLeadById = asyncHandler(async (req, res) => {
  const lead = await leadRepo.findLeadById(req.params.id);
  if (!lead)
    throw new CustomError(
      `Lead with id ${req.params.id} not found`,
      404,
      "LEAD_NOT_FOUND"
    );
  res.json({ success: true, data: lead });
});


const createLead = asyncHandler(async (req, res) => {
  const { email, userIds = [], ...leadData } = req.body;

  const existingLead = await leadRepo.findLeadByEmail(email);
  if (existingLead)
    throw new CustomError("Lead already exists", 400, "LEAD_ALREADY_EXISTS");

  const lead = await leadRepo.createLead({ email, ...leadData });

  
  if (userIds.length) {
    await lead.setUsers(userIds); 
  }

  res.status(201).json({ success: true, data: { id: lead.id } });
});


const updateLead = asyncHandler(async (req, res) => {
  const { userIds, ...updateData } = req.body;

  const lead = await leadRepo.findLeadById(req.params.id);
  if (!lead)
    throw new CustomError(
      `Lead with id ${req.params.id} not found`,
      404,
      "LEAD_NOT_FOUND"
    );

  await leadRepo.updateLead(lead, updateData);

  
  if (userIds) {
    await lead.setUsers(userIds);
  }

  res.json({ success: true, data: { id: lead.id, updatedAt: new Date() } });
});


const deleteLead = asyncHandler(async (req, res) => {
  const lead = await leadRepo.findLeadById(req.params.id);
  if (!lead)
    throw new CustomError(
      `Lead with id ${req.params.id} not found`,
      404,
      "LEAD_NOT_FOUND"
    );

  await leadRepo.deleteLead(lead);
  res.json({ success: true, data: { deleted: true } });
});

module.exports = { getLeads, getLeadById, createLead, updateLead, deleteLead };
