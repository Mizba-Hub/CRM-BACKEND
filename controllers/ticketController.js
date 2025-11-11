const asyncHandler = require("express-async-handler");
const ticketRepository = require("../repositories/ticketRepository");
const CustomError = require("../utils/customError");
const Company = require("../models/company");
const Deal = require("../models/deal");

const formatTicketResponse = (ticket) => {
  const leadDetails = ticket.Deal?.associatedLead;

  return {
    id: ticket.id,
    TicketName: ticket.TicketName,
    description: ticket.description,
    status: ticket.TicketStatus,
    priority: ticket.priority,
    source: ticket.source,
    owners:
      ticket.Users && ticket.Users.length > 0
        ? ticket.Users.map((user) => ({
            id: user.id,
            name: `${user.firstName} ${user.lastName}`,
          }))
        : [],
    deal: ticket.Deal
      ? {
          id: ticket.Deal.id,
          name: ticket.Deal.dealName,
          phoneNumber: leadDetails?.phoneNumber ?? null,
          city: leadDetails?.city ?? null,
        }
      : ticket.dealId
      ? { id: ticket.dealId, name: null, phoneNumber: null, city: null }
      : null,
    company: ticket.Company
      ? {
          id: ticket.Company.id,
          name: ticket.Company.companyName,
          phoneNumber: ticket.Company.phoneNumber,
          city: ticket.Company.city,
        }
      : ticket.companyId
      ? { id: ticket.companyId, name: null, phoneNumber: null, city: null }
      : null,
    createdAt: ticket.createdAt,
  };
};

const getTickets = asyncHandler(async (req, res) => {
  const {
    status,
    search,
    owner,
    priority,
    source,
    date,
    page = 1,
    size = 10,
  } = req.query;

  const tickets = await ticketRepository.findAllTickets({
    status,
    search,
    owner,
    priority,
    source,
    date,
    page,
    size,
  });

  const formattedTickets = tickets.map(formatTicketResponse);
  res.json({ success: true, data: formattedTickets });
});

const getTicketById = asyncHandler(async (req, res) => {
  const ticket = await ticketRepository.findTicketById(req.params.id);
  if (!ticket)
    throw new CustomError(
      `Ticket with id ${req.params.id} not found`,
      404,
      "TICKET_NOT_FOUND"
    );
  res.json({ success: true, data: formatTicketResponse(ticket) });
});

const createTicket = asyncHandler(async (req, res) => {
  const { userIds = [], ...rawTicketData } = req.body;

  const normalizedCompanyId =
    rawTicketData.companyId ?? rawTicketData.CompanyId ?? null;
  const normalizedDealId = rawTicketData.dealId ?? rawTicketData.DealId ?? null;

  if (normalizedCompanyId && normalizedDealId) {
    throw new CustomError(
      "Ticket can be linked to either a company or a deal, not both",
      400,
      "TICKET_TARGET_CONFLICT"
    );
  }

  if (!normalizedCompanyId && !normalizedDealId) {
    throw new CustomError(
      "Either companyId or dealId must be provided",
      400,
      "TICKET_TARGET_REQUIRED"
    );
  }

  if (normalizedCompanyId) {
    const company = await Company.findByPk(normalizedCompanyId);
    if (!company) {
      throw new CustomError("Company not found", 404, "COMPANY_NOT_FOUND");
    }
  }

  if (normalizedDealId) {
    const deal = await Deal.findByPk(normalizedDealId);
    if (!deal) {
      throw new CustomError("Deal not found", 404, "DEAL_NOT_FOUND");
    }
  }

  const ticketData = {
    ...rawTicketData,
    companyId: normalizedCompanyId,
    dealId: normalizedDealId,
  };

  delete ticketData.CompanyId;
  delete ticketData.CompanyName;
  delete ticketData.DealId;

  let finalUserIds = userIds;
  if (!finalUserIds.length && req.user?.id) {
    finalUserIds = [req.user.id];
  }

  const ticket = await ticketRepository.createTicket(ticketData);

  // Assign users to ticket
  if (finalUserIds.length) {
    await ticket.setUsers(finalUserIds);
  }

  res.status(201).json({ success: true, data: { id: ticket.id } });
});

const updateTicket = asyncHandler(async (req, res) => {
  const { userIds, ...rawUpdateData } = req.body;

  const ticket = await ticketRepository.findTicketById(req.params.id);
  if (!ticket)
    throw new CustomError(
      `Ticket with id ${req.params.id} not found`,
      404,
      "TICKET_NOT_FOUND"
    );

  const updateData = { ...rawUpdateData };
  const hasCompanyId =
    Object.prototype.hasOwnProperty.call(rawUpdateData, "companyId") ||
    Object.prototype.hasOwnProperty.call(rawUpdateData, "CompanyId");
  const hasDealId = Object.prototype.hasOwnProperty.call(
    rawUpdateData,
    "dealId"
  );

  let finalCompanyId = ticket.companyId;
  let finalDealId = ticket.dealId;

  if (hasCompanyId) {
    const incomingCompanyId =
      rawUpdateData.companyId ?? rawUpdateData.CompanyId ?? null;

    if (incomingCompanyId) {
      const company = await Company.findByPk(incomingCompanyId);
      if (!company) {
        throw new CustomError("Company not found", 404, "COMPANY_NOT_FOUND");
      }
    }

    updateData.companyId = incomingCompanyId;
    finalCompanyId = incomingCompanyId;
  }

  if (hasDealId) {
    const incomingDealId = rawUpdateData.dealId ?? null;

    if (incomingDealId) {
      const deal = await Deal.findByPk(incomingDealId);
      if (!deal) {
        throw new CustomError("Deal not found", 404, "DEAL_NOT_FOUND");
      }
    }

    updateData.dealId = incomingDealId;
    finalDealId = incomingDealId;
  }

  if (hasDealId && finalDealId && !hasCompanyId && ticket.companyId) {
    updateData.companyId = null;
    finalCompanyId = null;
  }

  if (hasCompanyId && finalCompanyId && !hasDealId && ticket.dealId) {
    updateData.dealId = null;
    finalDealId = null;
  }

  if (finalCompanyId && finalDealId) {
    throw new CustomError(
      "Ticket can be linked to either a company or a deal, not both",
      400,
      "TICKET_TARGET_CONFLICT"
    );
  }

  if (!finalCompanyId && !finalDealId) {
    throw new CustomError(
      "Either companyId or dealId must be provided",
      400,
      "TICKET_TARGET_REQUIRED"
    );
  }

  delete updateData.CompanyId;
  delete updateData.CompanyName;
  delete updateData.DealId;

  await ticketRepository.updateTicket(ticket, updateData);

  if (userIds) {
    await ticket.setUsers(userIds);
  }

  res.json({ success: true, data: { id: ticket.id, updatedAt: new Date() } });
});

const deleteTicket = asyncHandler(async (req, res) => {
  const ticket = await ticketRepository.findTicketById(req.params.id);
  if (!ticket)
    throw new CustomError(
      `Ticket with id ${req.params.id} not found`,
      404,
      "TICKET_NOT_FOUND"
    );

  await ticketRepository.deleteTicket(ticket);
  res.json({ success: true, data: { deleted: true } });
});

module.exports = {
  getTickets,
  getTicketById,
  createTicket,
  updateTicket,
  deleteTicket,
};
