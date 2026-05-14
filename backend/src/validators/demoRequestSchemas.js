const { z } = require("zod");

const demoRequestSchema = z.object({
  body: z.object({
    name: z.string().min(2),
    email: z.string().email(),
    company: z.string().optional(),
    phone: z.string().optional(),
    message: z.string().optional(),
    interestedPlan: z.enum(["free", "plus", "pro"]).optional(),
    orgId: z.number().int().positive().optional()
  }),
  params: z.object({}),
  query: z.object({})
});

const updateDemoRequestStatusSchema = z.object({
  body: z.object({
    status: z.enum(["new", "contacted", "converted", "closed"])
  }),
  params: z.object({ id: z.string().regex(/^\d+$/) }),
  query: z.object({})
});

module.exports = {
  demoRequestSchema,
  updateDemoRequestStatusSchema
};
