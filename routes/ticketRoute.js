const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/authMiddleware");
const {
  getTickets,
  getTicketById,
  createTicket,
  updateTicket,
  deleteTicket,
} = require("../controllers/ticketController");

router.use(authMiddleware);

router.route("/").get(getTickets).post(createTicket);

router
  .route("/:id")
  .get(getTicketById)
  .put(updateTicket)
  .delete(deleteTicket);

module.exports = router;
