const asyncHandler = require("express-async-handler");
const dealRepo = require("../repositories/dealRepository");
const leadRepo = require("../repositories/leadRepository");
const CustomError = require("../utils/customError");
const getDeals = asyncHandler(async (req, res) => {
  const deals = await dealRepo.findAllDeals(req.query);
  res.json({ success: true, data: deals });
});
const getDealById = asyncHandler(async (req, res) => {
  const deal = await dealRepo.findDealById(req.params.id);
  if (!deal)
    throw new CustomError(
      `Deal with id ${req.params.id} not found`,
      404,
      "DEAL_NOT_FOUND"
    );
  res.json({ success: true, data: deal });
});

const createDeal = asyncHandler(async (req, res) => {
  const { ownerIds = [], leadId, ...dealData } = req.body;

  if (!leadId) {
    throw new CustomError("Associated lead is required", 400, "LEAD_REQUIRED");
  }

  const lead = await leadRepo.findLeadById(leadId);
  if (!lead) {
    throw new CustomError("Lead not found", 404, "LEAD_NOT_FOUND");
  }

  const deal = await dealRepo.createDeal({ ...dealData, leadId });
  if (ownerIds.length) {
    await deal.setDealOwner(ownerIds);
  }
  if (lead.leadStatus.toLowerCase() !== "CONVERTED") {
    await leadRepo.updateLead(lead, { leadStatus: "CONVERTED" });
  }

  res.status(201).json({
    success: true,
    message: "Deal created and lead converted successfully",
    data: {
      id: deal.id,
      leadId: lead.id,
      leadStatus: "CONVERTED",
    },
  });
});

const convertLeadToDeal = asyncHandler(async (req, res) => {
  const { leadId, ownerIds = [], ...dealData } = req.body;

  const lead = await leadRepo.findLeadById(leadId);
  if (!lead) {
    throw new CustomError("Lead not found", 404, "LEAD_NOT_FOUND");
  }

  if (lead.leadStatus.toLowerCase() === "CONVERTED") {
    throw new CustomError("Lead is already converted", 400, "LEAD_ALREADY_CONVERTED");
  }

  const deal = await dealRepo.createDeal({ ...dealData, leadId });

  if (ownerIds.length) {
    await deal.setDealOwner(ownerIds);
  }

  await leadRepo.updateLead(lead, { leadStatus: "CONVERTED" });

  res.status(201).json({
    success: true,
    message: "Lead converted successfully",
    lead: { id: lead.id, leadStatus: "CONVERTED" },
    deal: {
      id: deal.id,
      dealName: deal.dealName,
      dealStage: deal.dealStage,
      amount: deal.amount,
      priority: deal.priority,
      leadId: lead.id,
      createdAt: deal.createdAt,
    },
  });
});
const updateDeal = asyncHandler(async (req, res) => {
  const { ownerIds, ...updateData } = req.body;

  const deal = await dealRepo.findDealById(req.params.id);
  if (!deal)
    throw new CustomError(
      `Deal with id ${req.params.id} not found`,
      404,
      "DEAL_NOT_FOUND"
    );

  await dealRepo.updateDeal(deal, updateData);

  if (ownerIds) {
    await deal.setDealOwner(ownerIds);
  }

  res.json({ success: true, data: { id: deal.id, updatedAt: new Date() } });
});
const deleteDeal = asyncHandler(async (req, res) => {
  const deal = await dealRepo.findDealById(req.params.id);
  if (!deal)
    throw new CustomError(
      `Deal with id ${req.params.id} not found`,
      404,
      "DEAL_NOT_FOUND"
    );

  await dealRepo.deleteDeal(deal);
  res.json({ success: true, data: { deleted: true } });
});

module.exports = {
  getDeals,
  getDealById,
  createDeal,
  updateDeal,
  deleteDeal,
  convertLeadToDeal,
};
