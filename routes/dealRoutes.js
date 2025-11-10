const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/authMiddleware");
const {
  getDeals,
  getDealById,
  createDeal,
  updateDeal,
  deleteDeal,
  convertLeadToDeal,
} = require("../controllers/dealController");
router.use(authMiddleware);
router.post("/convert", convertLeadToDeal);
router.route("/")
  .get(getDeals)
  .post(createDeal);

router.route("/:id")
  .get(getDealById)
  .put(updateDeal)
  .delete(deleteDeal);

module.exports = router;
