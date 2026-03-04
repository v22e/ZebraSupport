const { z } = require("zod");

const statusEnum = z.enum(["Open", "Auto-Replied", "Escalated", "Closed"]);
const priorityEnum = z.enum(["Low", "Medium", "High"]);

const listTicketsSchema = z.object({
  body: z.object({}),
  params: z.object({}),
  query: z.object({
    status: statusEnum.optional()
  })
});

const ticketIdParamSchema = z.object({
  body: z.object({}),
  params: z.object({ id: z.string().regex(/^\d+$/) }),
  query: z.object({})
});

const createTicketSchema = z.object({
  body: z.object({
    subject: z.string().min(3),
    description: z.string().min(5),
    requesterName: z.string().min(2),
    requesterEmail: z.string().email(),
    company: z.string().min(2),
    priority: priorityEnum.optional(),
    status: statusEnum.optional()
  }),
  params: z.object({}),
  query: z.object({})
});

const updateTicketSchema = z.object({
  body: z
    .object({
      subject: z.string().min(3).optional(),
      description: z.string().min(5).optional(),
      status: statusEnum.optional(),
      priority: priorityEnum.optional(),
      manualReply: z.string().min(2).optional(),
      isRead: z.boolean().optional()
    })
    .refine((data) => Object.keys(data).length > 0, {
      message: "At least one field must be provided"
    }),
  params: z.object({ id: z.string().regex(/^\d+$/) }),
  query: z.object({})
});

module.exports = {
  listTicketsSchema,
  ticketIdParamSchema,
  createTicketSchema,
  updateTicketSchema
};
