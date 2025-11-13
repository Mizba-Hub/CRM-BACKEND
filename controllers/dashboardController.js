const dashboardService = require("../services/dashboardService");

exports.getDashboardData = async (req, res, next) => {
  try {
    const data = await dashboardService.fetchDashboardData();
    res.status(200).json({
      success: true,
      message: "Dashboard data fetched successfully",
      data,
    });
  } catch (error) {
    console.error("Dashboard Controller Error:", error);
    next(error);
  }
};
