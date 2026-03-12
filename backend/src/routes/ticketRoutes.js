const express = require("express");
const asyncHandler = require("../utils/asyncHandler");
const validate = require("../middleware/validate");
const authMiddleware = require("../middleware/auth");
const requireRoles = require("../middleware/requireRoles");
const orgScope = require("../middleware/orgScope");
const planLimits = require("../middleware/planLimits");
const {
  listTicketsSchema,
  ticketIdParamSchema,
  createTicketSchema,
  updateTicketSchema,
  assignTicketSchema
} = require("../validators/ticketSchemas");
const {
  getTickets,
  getTicketById,
  createTicket,
  updateTicket,
  assignTicket,
  exportTicketsCsv,
  deleteTicket,
  resetAllTickets,
  loadDemoTickets,
  removeDemoTickets
} = require("../controllers/ticketController");

const router = express.Router();

router.use(authMiddleware);
router.use(orgScope);
router.use(planLimits);

router.get("/", requireRoles("org_owner", "org_admin", "user"), validate(listTicketsSchema), asyncHandler(getTickets));
router.get("/export", requireRoles("org_owner", "org_admin"), asyncHandler(exportTicketsCsv));
router.delete("/reset", requireRoles("org_owner", "org_admin"), asyncHandler(resetAllTickets));
router.post("/demo/load", requireRoles("org_owner", "org_admin"), asyncHandler(loadDemoTickets));
router.delete("/demo/remove", requireRoles("org_owner", "org_admin"), asyncHandler(removeDemoTickets));
router.patch("/:id(\\d+)/assign", requireRoles("org_owner", "org_admin"), validate(assignTicketSchema), asyncHandler(assignTicket));
router.get("/:id(\\d+)", requireRoles("org_owner", "org_admin", "user"), validate(ticketIdParamSchema), asyncHandler(getTicketById));
router.post("/", requireRoles("org_owner", "org_admin", "user"), validate(createTicketSchema), asyncHandler(createTicket));
router.patch("/:id(\\d+)", requireRoles("org_owner", "org_admin", "user"), validate(updateTicketSchema), asyncHandler(updateTicket));
router.delete("/:id(\\d+)", requireRoles("org_owner"), validate(ticketIdParamSchema), asyncHandler(deleteTicket));

module.exports = router;

