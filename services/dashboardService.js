const Lead = require("../models/lead");
const Deal = require("../models/deal");
const User = require("../models/user");

const {
  parseAmount,
  calcKPIs,
  calcConversion,
  calcSalesReports,
  calcTeamPerformance,
} = require("../utils/dashboardUtils");

exports.fetchDashboardData = async () => {
  try {
    const leads = await Lead.findAll({ raw: true });

    const dealsRaw = await Deal.findAll({
      include: [
        {
          association: "dealOwner",
          attributes: ["id", "firstName", "lastName"],
          through: { attributes: [] },
        },
        {
          association: "associatedLead",
          attributes: ["id", "leadStatus"],
          required: false,
        },
      ],
    });

    const users = await User.findAll({ raw: true });

    const deals = dealsRaw.map((d) => {
      const owners = Array.isArray(d.dealOwner)
        ? d.dealOwner.map((o) => ({
            id: o.id,
            firstName: o.firstName,
            lastName: o.lastName,
          }))
        : [];

      return {
        id: d.id,
        dealName: d.dealName,
        dealStage: d.dealStage,
        amount: parseAmount(d.amount),
        closeDate: d.closeDate,
        createdAt: d.createdAt,
        owners,
        associatedLead: d.associatedLead || null,
      };
    });

    const kpis = calcKPIs(leads, deals);
    const conversionData = calcConversion(leads, deals);
    const salesReports = calcSalesReports(deals);
    const teamPerformance = calcTeamPerformance(users, deals);

    return {
      totalLeads: kpis.totalLeads,
      ActiveDeals: kpis.ActiveDeals,
      ClosedDeals: kpis.ClosedDeals,
      MonthlyRevenue: kpis.MonthlyRevenue,

      conversionData,
      salesReports,
      teamPerformance,
    };
  } catch (error) {
    console.error("Dashboard Service Error:", error);
    throw error;
  }
};
