const { z } = require("zod");
const { NOTIFICATION_TYPES } = require("../services/notificationService");

const notificationTypeEnum = z.enum(NOTIFICATION_TYPES);

const listNotificationsSchema = z.object({
  body: z.object({}),
  params: z.object({}),
  query: z.object({
    limit: z.coerce.number().int().min(1).max(100).optional(),
    offset: z.coerce.number().int().min(0).optional(),
    unread: z
      .union([z.string(), z.boolean()])
      .optional()
      .transform((value) => {
        if (value === undefined) return undefined;
        return String(value).toLowerCase() === "true";
      }),
    type: notificationTypeEnum.optional()
  })
});

const notificationIdParamSchema = z.object({
  body: z.object({}),
  params: z.object({ id: z.string().regex(/^\d+$/) }),
  query: z.object({})
});

const notificationPreferenceSchema = z.object({
  body: z.object({
    type: notificationTypeEnum,
    enabled: z.boolean()
  }),
  params: z.object({}),
  query: z.object({})
});

module.exports = {
  listNotificationsSchema,
  notificationIdParamSchema,
  notificationPreferenceSchema
};
