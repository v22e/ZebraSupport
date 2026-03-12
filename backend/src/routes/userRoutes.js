const express = require("express");
const asyncHandler = require("../utils/asyncHandler");
const validate = require("../middleware/validate");
const authMiddleware = require("../middleware/auth");
const requireRoles = require("../middleware/requireRoles");
const orgScope = require("../middleware/orgScope");
const {
  inviteUserSchema,
  userIdParamSchema,
  updateUserRoleSchema,
  updateCurrentUserSchema
} = require("../validators/userSchemas");
const {
  listUsers,
  inviteUser,
  updateUserRole,
  deactivateUser,
  activateUser,
  updateCurrentUser,
  deactivateCurrentUser
} = require("../controllers/userController");

const router = express.Router();

router.use(authMiddleware);
router.use(orgScope);
router.patch("/me", validate(updateCurrentUserSchema), asyncHandler(updateCurrentUser));
router.patch("/me/deactivate", asyncHandler(deactivateCurrentUser));

router.use(requireRoles("superadmin", "org_owner", "org_admin"));

router.get("/", asyncHandler(listUsers));
router.post("/invite", validate(inviteUserSchema), asyncHandler(inviteUser));
router.patch("/:id/role", validate(updateUserRoleSchema), asyncHandler(updateUserRole));
router.patch("/:id/deactivate", validate(userIdParamSchema), asyncHandler(deactivateUser));
router.patch("/:id/activate", validate(userIdParamSchema), asyncHandler(activateUser));

module.exports = router;
