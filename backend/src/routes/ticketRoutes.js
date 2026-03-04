const express = require("express");
const asyncHandler = require("../utils/asyncHandler");
const validate = require("../middleware/validate");
const authMiddleware = require("../middleware/auth");
const {
  listTicketsSchema,
  ticketIdParamSchema,
  createTicketSchema,
  updateTicketSchema
} = require("../validators/ticketSchemas");
const {
  getTickets,
  getTicketById,
  createTicket,
  updateTicket,
  deleteTicket
} = require("../controllers/ticketController");

const router = express.Router();

router.use(authMiddleware);

router.get("/", validate(listTicketsSchema), asyncHandler(getTickets));
router.get("/:id", validate(ticketIdParamSchema), asyncHandler(getTicketById));
router.post("/", validate(createTicketSchema), asyncHandler(createTicket));
router.patch("/:id", validate(updateTicketSchema), asyncHandler(updateTicket));
router.delete("/:id", validate(ticketIdParamSchema), asyncHandler(deleteTicket));

module.exports = router;