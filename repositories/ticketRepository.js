const Ticket = require("../models/ticket");
const User = require("../models/user");
const Company = require("../models/company");
const Deal = require("../models/deal");
const Lead = require("../models/lead");
const { Op, Sequelize } = require("sequelize");

const findAllTickets = async (query) => {
  const {
    status,
    search,
    owner,
    priority,
    source,
    date,
    page = 1,
    size = 10,
  } = query;

  const where = {};

  if (status) {
    const statusArray = status.split(",").map((s) => s.trim());
    where.TicketStatus = { [Op.in]: statusArray };
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
    const dateParts = date.split("-");
    if (dateParts.length === 3) {
      const year = parseInt(dateParts[0], 10);
      const month = parseInt(dateParts[1], 10) - 1;
      const day = parseInt(dateParts[2], 10);

      const startDate = new Date(year, month, day, 0, 0, 0, 0);

      const endDate = new Date(year, month, day + 1, 0, 0, 0, 0);

      where.createdAt = {
        [Op.gte]: startDate,
        [Op.lt]: endDate,
      };
    } else {
      const startDate = new Date(date);
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 1);
      where.createdAt = {
        [Op.gte]: startDate,
        [Op.lt]: endDate,
      };
    }
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

  let hasSearch = false;
  let hasNestedSearch = false;

  if (search) {
    const normalizedSearch = search
      .trim()
      .replace(/\s+/g, " ")
      .replace(/'/g, "''");

    const directSearchConditions = [
      { TicketName: { [Op.iLike]: `%${normalizedSearch}%` } },
      { description: { [Op.iLike]: `%${normalizedSearch}%` } },
    ];

    const isPaginated = parseInt(size) < 999999; // Assuming reasonable page size

    if (isPaginated) {
      where[Op.or] = directSearchConditions;
      hasSearch = true;
      hasNestedSearch = true;
    } else {
      where[Op.or] = [
        ...directSearchConditions,
        { "$Company.companyName$": { [Op.iLike]: `%${normalizedSearch}%` } },
        { "$Company.phoneNumber$": { [Op.iLike]: `%${normalizedSearch}%` } },
        { "$Company.city$": { [Op.iLike]: `%${normalizedSearch}%` } },
        { "$Deal.dealName$": { [Op.iLike]: `%${normalizedSearch}%` } },
        {
          "$Deal.associatedLead.phoneNumber$": {
            [Op.iLike]: `%${normalizedSearch}%`,
          },
        },
        {
          "$Deal.associatedLead.city$": { [Op.iLike]: `%${normalizedSearch}%` },
        },
      ];
      hasSearch = true;
    }
  }

  let hasExplicitCompanyFilter = false;
  let hasExplicitDealFilter = false;

  if (query.companyName) {
    where["$Company.companyName$"] = { [Op.iLike]: `%${query.companyName}%` };
    hasExplicitCompanyFilter = true;
  }

  if (query.companyPhone) {
    where["$Company.phoneNumber$"] = { [Op.iLike]: `%${query.companyPhone}%` };
    hasExplicitCompanyFilter = true;
  }

  if (query.companyCity) {
    where["$Company.city$"] = { [Op.iLike]: `%${query.companyCity}%` };
    hasExplicitCompanyFilter = true;
  }

  if (query.dealName) {
    where["$Deal.dealName$"] = { [Op.iLike]: `%${query.dealName}%` };
    hasExplicitDealFilter = true;
  }

  if (query.leadPhone) {
    where["$Deal.associatedLead.phoneNumber$"] = {
      [Op.iLike]: `%${query.leadPhone}%`,
    };
    hasExplicitDealFilter = true;
  }

  if (query.leadCity) {
    where["$Deal.associatedLead.city$"] = { [Op.iLike]: `%${query.leadCity}%` };
    hasExplicitDealFilter = true;
  }

  if (hasExplicitCompanyFilter) {
    includeCompany.required = true;
  }

  if (hasExplicitDealFilter) {
    includeDeal.required = true;
    if (includeDeal.include && includeDeal.include.length) {
      includeDeal.include[0].required = true;
    }
  }

  try {
    let tickets;

    if (hasNestedSearch && search) {
      const normalizedSearch = search.trim().replace(/\s+/g, " ");

      const whereWithoutSearch = { ...where };
      delete whereWithoutSearch[Op.or];

      const allTickets = await Ticket.findAll({
        where: whereWithoutSearch,
        include,
        distinct: true,
        order: [["createdAt", "DESC"]],
      });

      const searchLower = normalizedSearch.toLowerCase();
      const filteredTickets = allTickets.filter((ticket) => {
        if (
          (ticket.TicketName &&
            ticket.TicketName.toLowerCase().includes(searchLower)) ||
          (ticket.description &&
            ticket.description.toLowerCase().includes(searchLower))
        ) {
          return true;
        }

        if (ticket.Company) {
          if (
            (ticket.Company.companyName &&
              ticket.Company.companyName.toLowerCase().includes(searchLower)) ||
            (ticket.Company.phoneNumber &&
              ticket.Company.phoneNumber.toLowerCase().includes(searchLower)) ||
            (ticket.Company.city &&
              ticket.Company.city.toLowerCase().includes(searchLower))
          ) {
            return true;
          }
        }

        if (ticket.Deal) {
          if (
            ticket.Deal.dealName &&
            ticket.Deal.dealName.toLowerCase().includes(searchLower)
          ) {
            return true;
          }

          if (ticket.Deal.associatedLead) {
            if (
              (ticket.Deal.associatedLead.phoneNumber &&
                ticket.Deal.associatedLead.phoneNumber
                  .toLowerCase()
                  .includes(searchLower)) ||
              (ticket.Deal.associatedLead.city &&
                ticket.Deal.associatedLead.city
                  .toLowerCase()
                  .includes(searchLower))
            ) {
              return true;
            }
          }
        }
        return false;
      });

      const startIndex = (parseInt(page) - 1) * parseInt(size);
      const endIndex = startIndex + parseInt(size);
      tickets = filteredTickets.slice(startIndex, endIndex);
    } else {
      tickets = await Ticket.findAll({
        where,
        include,
        distinct: true,
        limit: parseInt(size),
        offset: (parseInt(page) - 1) * parseInt(size),
        order: [["createdAt", "DESC"]],
        subquery: false,
      });
    }

    return tickets;
  } catch (error) {
    console.error("Error in findAllTickets:", error);
    throw error;
  }
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
