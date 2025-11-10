const Ticket = require("../models/ticket");
const User = require("../models/user");
const Company = require("../models/company");
const Deal = require("../models/deal");
const Lead = require("../models/lead");
const { Op } = require("sequelize");

const findAllTickets = async (query) => {
  const { status, search, owner, priority, source, date, page = 1, size = 10 } = query;

  const where = {};

  if (status) {
    const statusArray = status.split(",").map((s) => s.trim());
    where.TicketStatus = { [Op.in]: statusArray };
  }

  const includeUsers = {
    model: User,
    as: "Users",
    attributes: ["id", "firstName", "lastName", "email"],
    through: { attributes: [] },
    required: false,
  };

  const includeCompany = {
    model: Company,
    as: "Company",
    attributes: [
      "id",
      "companyName",
      "phoneNumber",
      "city",
      "country",
      "domainName",
    ],
    required: false,
  };

  const includeDeal = {
    model: Deal,
    as: "Deal",
    attributes: ["id", "dealName"],
    required: false,
    include: [
      {
        model: Lead,
        as: "associatedLead",
        attributes: [
          "id",
          "firstName",
          "lastName",
          "email",
          "phoneNumber",
          "city",
        ],
        required: false,
      },
    ],
  };

  const include = [includeUsers, includeCompany, includeDeal];

  if (owner) {
    includeUsers.where = { id: owner };
    includeUsers.required = true;
  }

  if (priority) {
    const priorityArray = priority.split(",").map((p) => p.trim());
    where.priority = { [Op.in]: priorityArray };
  }

  if (source) {
    const sourceArray = source.split(",").map((s) => s.trim());
    where.source = { [Op.in]: sourceArray };
  }

  if (date) {
    const startDate = new Date(date);
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 1);
    where.createdAt = {
      [Op.gte]: startDate,
      [Op.lt]: endDate,
    };
  }

  let needsUserJoin = Boolean(owner);
  let needsCompanyJoin = false;
  let needsDealJoin = false;

  if (search) {
    const normalizedSearch = search.trim().replace(/\s+/g, " ");
    where[Op.or] = [
      { TicketName: { [Op.iLike]: `%${normalizedSearch}%` } },
      { description: { [Op.iLike]: `%${normalizedSearch}%` } },
      { "$Deal.dealName$": { [Op.iLike]: `%${normalizedSearch}%` } },
      {
        "$Deal.associatedLead.phoneNumber$": {
          [Op.iLike]: `%${normalizedSearch}%`,
        },
      },
      {
        "$Deal.associatedLead.city$": {
          [Op.iLike]: `%${normalizedSearch}%`,
        },
      },
      { "$Company.companyName$": { [Op.iLike]: `%${normalizedSearch}%` } },
      { "$Company.phoneNumber$": { [Op.iLike]: `%${normalizedSearch}%` } },
      { "$Company.city$": { [Op.iLike]: `%${normalizedSearch}%` } },
    ];
    needsCompanyJoin = true;
    needsDealJoin = true;
  }

  if (query.companyName) {
    where["$Company.companyName$"] = { [Op.iLike]: `%${query.companyName}%` };
    needsCompanyJoin = true;
  }

  if (query.companyPhone) {
    where["$Company.phoneNumber$"] = { [Op.iLike]: `%${query.companyPhone}%` };
    needsCompanyJoin = true;
  }

  if (query.companyCity) {
    where["$Company.city$"] = { [Op.iLike]: `%${query.companyCity}%` };
    needsCompanyJoin = true;
  }

  if (query.dealName) {
    where["$Deal.dealName$"] = { [Op.iLike]: `%${query.dealName}%` };
    needsDealJoin = true;
  }

  if (query.leadPhone) {
    where["$Deal.associatedLead.phoneNumber$"] = {
      [Op.iLike]: `%${query.leadPhone}%`,
    };
    needsDealJoin = true;
  }

  if (query.leadCity) {
    where["$Deal.associatedLead.city$"] = { [Op.iLike]: `%${query.leadCity}%` };
    needsDealJoin = true;
  }

  if (needsUserJoin) {
    includeUsers.required = true;
  }

  if (needsCompanyJoin) {
    includeCompany.required = true;
  }

  if (needsDealJoin) {
    includeDeal.required = true;
    if (includeDeal.include && includeDeal.include.length) {
      includeDeal.include[0].required = true;
    }
  }

  const tickets = await Ticket.findAll({
    where,
    include,
    limit: parseInt(size),
    offset: (parseInt(page) - 1) * parseInt(size),
    order: [["createdAt", "DESC"]],
  });

  return tickets;
};

const findTicketById = async (id) => {
  const ticket = await Ticket.findByPk(id, {
    include: [
      {
        model: User,
        as: "Users",
        attributes: ["id", "firstName", "lastName", "email"],
        through: { attributes: [] },
      },
      {
        model: Company,
        as: "Company",
        attributes: [
          "id",
          "companyName",
          "phoneNumber",
          "city",
          "country",
          "domainName",
        ],
      },
      {
        model: Deal,
        as: "Deal",
        attributes: ["id", "dealName"],
        include: [
          {
            model: Lead,
            as: "associatedLead",
            attributes: [
              "id",
              "firstName",
              "lastName",
              "email",
              "phoneNumber",
              "city",
            ],
          },
        ],
      },
    ],
  });

  return ticket;
};

const createTicket = async (data) => {
  const ticket = await Ticket.create(data);
  return ticket;
};

const updateTicket = async (ticket, data) => {
  await ticket.update(data);
  return ticket;
};

const deleteTicket = async (ticket) => {
  await ticket.destroy();
  return true;
};

module.exports = {
  findAllTickets,
  findTicketById,
  createTicket,
  updateTicket,
  deleteTicket,
};
