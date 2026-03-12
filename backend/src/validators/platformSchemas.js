const { z } = require("zod");

const organisationIdParamSchema = z.object({
  body: z.object({}),
  params: z.object({ id: z.string().regex(/^\d+$/) }),
  query: z.object({})
});

const createOrganisationSchema = z.object({
  body: z.object({
    name: z.string().min(2),
    plan: z.enum(["free", "plus", "pro"]).optional()
  }),
  params: z.object({}),
  query: z.object({})
});

const updateOrganisationPlanSchema = z.object({
  body: z.object({
    plan: z.enum(["free", "plus", "pro"])
  }),
  params: z.object({ id: z.string().regex(/^\d+$/) }),
  query: z.object({})
});

module.exports = {
  organisationIdParamSchema,
  createOrganisationSchema,
  updateOrganisationPlanSchema
};
