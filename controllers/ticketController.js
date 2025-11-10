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

  const companyId = rawTicketData.companyId || rawTicketData.CompanyId;
  if (!companyId) {
    throw new CustomError(
      "Company is required for a ticket",
      400,
      "COMPANY_REQUIRED"
    );
  }

  const company = await Company.findByPk(companyId);
  if (!company) {
    throw new CustomError("Company not found", 404, "COMPANY_NOT_FOUND");
  }

  const ticketData = {
    ...rawTicketData,
    companyId,
  };

  if (ticketData.dealId) {
    const deal = await Deal.findByPk(ticketData.dealId);
    if (!deal) {
      throw new CustomError("Deal not found", 404, "DEAL_NOT_FOUND");
    }
  }

  delete ticketData.CompanyId;
  delete ticketData.CompanyName;

  let finalUserIds = userIds;
  if (!finalUserIds.length && req.user?.id) {
    finalUserIds = [req.user.id];
  }

  const ticket = await ticketRepository.createTicket(ticketData);

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
  const incomingCompanyId = rawUpdateData.companyId || rawUpdateData.CompanyId;

  if (typeof incomingCompanyId !== "undefined") {
    if (!incomingCompanyId) {
      throw new CustomError(
        "Company is required for a ticket",
        400,
        "COMPANY_REQUIRED"
      );
    }

    const company = await Company.findByPk(incomingCompanyId);
    if (!company) {
      throw new CustomError("Company not found", 404, "COMPANY_NOT_FOUND");
    }

    updateData.companyId = incomingCompanyId;
  }

  if (Object.prototype.hasOwnProperty.call(rawUpdateData, "dealId")) {
    if (rawUpdateData.dealId) {
      const deal = await Deal.findByPk(rawUpdateData.dealId);
      if (!deal) {
        throw new CustomError("Deal not found", 404, "DEAL_NOT_FOUND");
      }
      updateData.dealId = rawUpdateData.dealId;
    } else {
      updateData.dealId = null;
    }
  }

  delete updateData.CompanyId;
  delete updateData.CompanyName;

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
