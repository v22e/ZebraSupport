const { z } = require("zod");

const roleEnum = z.enum(["superadmin", "org_owner", "org_admin", "user"]);
const orgAssignableRoleEnum = z.enum(["org_admin", "user"]);

const inviteUserSchema = z.object({
  body: z.object({
    email: z.string().email(),
    role: orgAssignableRoleEnum.optional()
  }),
  params: z.object({}),
  query: z.object({})
});

const userIdParamSchema = z.object({
  body: z.object({}),
  params: z.object({ id: z.string().regex(/^\d+$/) }),
  query: z.object({})
});

const updateUserRoleSchema = z.object({
  body: z.object({
    role: roleEnum,
    orgId: z.number().int().positive().optional()
  }),
  params: z.object({ id: z.string().regex(/^\d+$/) }),
  query: z.object({})
});

const updateCurrentUserSchema = z.object({
  body: z
    .object({
      name: z.string().min(2).optional(),
      currentPassword: z.string().min(8).optional(),
      newPassword: z.string().min(8).optional()
    })
    .refine((data) => Object.keys(data).length > 0, {
      message: "At least one field must be provided"
    })
    .refine(
      (data) => {
        if (data.newPassword) {
          return Boolean(data.currentPassword);
        }
        return true;
      },
      {
        path: ["currentPassword"],
        message: "Current password is required to set a new password"
      }
    ),
  params: z.object({}),
  query: z.object({})
});

module.exports = {
  roleEnum,
  orgAssignableRoleEnum,
  inviteUserSchema,
  userIdParamSchema,
  updateUserRoleSchema,
  updateCurrentUserSchema
};

