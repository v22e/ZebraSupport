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
    requesterName: z.string().min(2).optional(),
    requesterEmail: z.string().email().optional(),
    company: z.string().min(2).optional(),
    priority: priorityEnum.optional(),
    status: statusEnum.optional(),
    assignedTo: z.number().int().positive().optional()
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
      message: z.string().min(2).optional(),
      isRead: z.boolean().optional(),
      assignedTo: z.number().int().positive().nullable().optional()
    })
    .refine((data) => Object.keys(data).length > 0, {
      message: "At least one field must be provided"
    }),
  params: z.object({ id: z.string().regex(/^\d+$/) }),
  query: z.object({})
});

const assignTicketSchema = z.object({
  body: z.object({
    assignedTo: z.number().int().positive()
  }),
  params: z.object({ id: z.string().regex(/^\d+$/) }),
  query: z.object({})
});

module.exports = {
  listTicketsSchema,
  ticketIdParamSchema,
  createTicketSchema,
  updateTicketSchema,
  assignTicketSchema
};
