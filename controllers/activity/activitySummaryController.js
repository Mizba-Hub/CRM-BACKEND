const activityRepo = require("../../repositories/activity/activitySummaryRepository");

const getActivitySummary = async (req, res) => {
  try {
    const {
      linkedModule,
      linkedId,
      page = 1,
      size = 20,
      search = "",
      activityTypes,
    } = req.query;

    if (!linkedModule || !linkedId) {
      return res.status(400).json({
        message: "linkedModule and linkedId are required",
      });
    }

    const types = activityTypes
      ? activityTypes.split(",")
      : ["note", "email", "call", "task", "meeting", "attachment"];

    const result = await activityRepo.getActivitySummary({
      linkedModule,
      linkedId,
      page: Number(page),
      size: Number(size),
      search,
      types,
    });

    res.json({
      linkedModule,
      linkedId,
      activities: result.activities,
      page: Number(page),
      size: Number(size),
      total: result.total,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getActivitySummary };
