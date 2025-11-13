function parseAmount(v) {
  if (!v) return 0;
  const cleaned = String(v).replace(/[^0-9.-]+/g, "");
  const n = parseFloat(cleaned);
  return Number.isFinite(n) ? n : 0;
}

function calcKPIs(leads, deals) {
  const totalLeads = leads.length;
  const closedSet = new Set(["Closed Won", "Closed Lost"]);

  let activeDeals = 0;
  let closedDeals = 0;
  let monthlyRevenue = 0;

  const now = new Date();
  const cm = now.getMonth(),
    cy = now.getFullYear();

  deals.forEach((d) => {
    const amt = Number(d.amount || 0);

    if (closedSet.has(d.dealStage)) {
      closedDeals++;
      if (d.dealStage === "Closed Won" && d.closeDate) {
        const cd = new Date(d.closeDate);
        if (cd.getMonth() === cm && cd.getFullYear() === cy) {
          monthlyRevenue += amt;
        }
      }
    } else {
      activeDeals++;
    }
  });

  return {
    totalLeads,
    ActiveDeals: activeDeals,
    ClosedDeals: closedDeals,
    MonthlyRevenue: Math.round(monthlyRevenue),
  };
}

function calcConversion(leads, deals) {
  const totalLeads = leads.length || 1;
  const totalDeals = deals.length || 1;

  const contactCount = leads.filter((l) => l.leadStatus !== "NEW").length;
  const qualifiedCount = leads.filter(
    (l) => l.leadStatus === "QUALIFIED"
  ).length;

  const proposalSent = deals.filter(
    (d) => d.dealStage === "Contract Sent"
  ).length;

  const negotiationStages = new Set([
    "Negotiation",
    "Presentation Scheduled",
    "Qualified to Buy",
    "Decision Maker Bought In",
    "Appointment Scheduled",
  ]);
  const negotiationCount = deals.filter((d) =>
    negotiationStages.has(d.dealStage)
  ).length;

  const closedWon = deals.filter((d) => d.dealStage === "Closed Won").length;
  const closedLost = deals.filter((d) => d.dealStage === "Closed Lost").length;

  const p = (n, d) => Number(((n / d) * 100).toFixed(2));

  return [
    { label: "Contact", percent: p(contactCount, totalLeads) },
    { label: "Qualified Lead", percent: p(qualifiedCount, totalLeads) },
    { label: "Proposal Sent", percent: p(proposalSent, totalDeals) },
    { label: "Negotiation", percent: p(negotiationCount, totalDeals) },
    { label: "Closed Won", percent: p(closedWon, totalDeals) },
    { label: "Closed Lost", percent: p(closedLost, totalDeals) },
  ];
}

function calcSalesReports(deals) {
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  const data = Array.from({ length: 12 }, (_, i) => ({
    m: months[i],
    base: 0,
    cap: 0,
  }));

  deals.forEach((d) => {
    const dt = d.closeDate ? new Date(d.closeDate) : new Date(d.createdAt);
    const idx = dt.getMonth();
    const amt = Number(d.amount || 0);

    if (d.dealStage === "Closed Won") {
      data[idx].base += amt;
    } else if (d.dealStage !== "Closed Lost") {
      data[idx].cap += amt;
    }
  });

  return data.map((m) => ({
    m: m.m,
    base: Math.round(m.base),
    cap: Math.round(m.cap),
  }));
}

function calcTeamPerformance(users, deals) {
  const closedSet = new Set(["Closed Won", "Closed Lost"]);

  const now = new Date();
  const thisM = now.getMonth(),
    thisY = now.getFullYear();
  const prev = new Date(thisY, thisM - 1, 1);
  const prevM = prev.getMonth(),
    prevY = prev.getFullYear();

  const userMap = {};
  users.forEach((u) => (userMap[u.id] = { ...u, deals: [] }));

  deals.forEach((d) => {
    d.owners?.forEach((o) => {
      if (userMap[o.id]) userMap[o.id].deals.push(d);
    });
  });

  return Object.values(userMap).map((u) => {
    const active = u.deals.filter((d) => !closedSet.has(d.dealStage)).length;
    const closed = u.deals.filter((d) => closedSet.has(d.dealStage)).length;

    const revThis = u.deals
      .filter((d) => d.dealStage === "Closed Won" && d.closeDate)
      .filter((d) => {
        const cd = new Date(d.closeDate);
        return cd.getMonth() === thisM && cd.getFullYear() === thisY;
      })
      .reduce((t, d) => t + Number(d.amount || 0), 0);

    const revPrev = u.deals
      .filter((d) => d.dealStage === "Closed Won" && d.closeDate)
      .filter((d) => {
        const cd = new Date(d.closeDate);
        return cd.getMonth() === prevM && cd.getFullYear() === prevY;
      })
      .reduce((t, d) => t + Number(d.amount || 0), 0);

    const change =
      revPrev === 0
        ? revThis > 0
          ? "+100%"
          : "0%"
        : `${(((revThis - revPrev) / revPrev) * 100).toFixed(1)}%`;

    return {
      employee: `${u.firstName} ${u.lastName}`,
      activeDeals: active,
      closedDeals: closed,
      revenue: `$${revThis.toLocaleString()}`,
      change,
    };
  });
}

module.exports = {
  parseAmount,
  calcKPIs,
  calcConversion,
  calcSalesReports,
  calcTeamPerformance,
};
