const express = require("express");
const asyncHandler = require("../utils/asyncHandler");
const validate = require("../middleware/validate");
const authMiddleware = require("../middleware/auth");
const requireRoles = require("../middleware/requireRoles");
const {
  organisationIdParamSchema,
  createOrganisationSchema,
  updateOrganisationPlanSchema
} = require("../validators/platformSchemas");
const { updateDemoRequestStatusSchema } = require("../validators/demoRequestSchemas");
const {
  createOrganisation,
  getPlatformSummary,
  listOrganisations,
  getOrganisationById,
  updateOrganisationPlan,
  suspendOrganisation,
  activateOrganisation,
  deleteOrganisation
} = require("../controllers/platformController");
const { listDemoRequests, updateDemoRequestStatus } = require("../controllers/demoRequestController");

const router = express.Router();

router.use(authMiddleware);
router.use(requireRoles("superadmin"));

router.post("/organisations", validate(createOrganisationSchema), asyncHandler(createOrganisation));
router.get("/summary", asyncHandler(getPlatformSummary));
router.get("/organisations", asyncHandler(listOrganisations));
router.get("/organisations/:id", validate(organisationIdParamSchema), asyncHandler(getOrganisationById));
router.patch("/organisations/:id/plan", validate(updateOrganisationPlanSchema), asyncHandler(updateOrganisationPlan));
router.patch("/organisations/:id/suspend", validate(organisationIdParamSchema), asyncHandler(suspendOrganisation));
router.patch("/organisations/:id/activate", validate(organisationIdParamSchema), asyncHandler(activateOrganisation));
router.delete("/organisations/:id", validate(organisationIdParamSchema), asyncHandler(deleteOrganisation));
router.get("/demo-requests", asyncHandler(listDemoRequests));
router.patch("/demo-requests/:id/status", validate(updateDemoRequestStatusSchema), asyncHandler(updateDemoRequestStatus));

module.exports = router;
