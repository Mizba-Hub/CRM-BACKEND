const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/authMiddleware");
const {
  getAllLeads,
  getLeadById,
  createLead,
  updateLead,
  deleteLead,
} = require("../controllers/leadController");

router.use(authMiddleware);

router.route("/").get(getAllLeads).post(createLead);

router.route("/:id").get(getLeadById).put(updateLead).delete(deleteLead);

module.exports = router;
