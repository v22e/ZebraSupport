const { z } = require("zod");

const registerSchema = z.object({
  body: z
    .object({
      name: z.string().min(2),
      company: z.string().min(2),
      email: z.string().email(),
      password: z.string().min(8),
      confirmPassword: z.string().min(8)
    })
    .refine((data) => data.password === data.confirmPassword, {
      path: ["confirmPassword"],
      message: "Passwords do not match"
    }),
  params: z.object({}),
  query: z.object({})
});

const loginSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(8)
  }),
  params: z.object({}),
  query: z.object({})
});

module.exports = {
  registerSchema,
  loginSchema
};