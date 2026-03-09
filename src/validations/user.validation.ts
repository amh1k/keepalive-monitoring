import z from "zod";
const emailSchema = z
  .string("Email is reqired")
  .trim()
  .email("Invalid email format");

const passwordSchema = z
  .string("Password is required")
  .min(3, "Password must be at least 8 characters long")
  .max(100, "Password is too long");

export const registerSchema = z.object({
  body: z.object({
    email: emailSchema,
    password: passwordSchema,
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: emailSchema,
    password: z.string().min(1, "Password is required"),
  }),
});

// export const changePasswordSchema = z.object({
//   body: z
//     .object({
//       oldPassword: z.string().min(1, "Old password is required"),
//       newPassword: passwordSchema,
//     })
//     .refine((data) => data.oldPassword !== data.newPassword, {
//       message: "New password must be different from the old password",
//       path: ["newPassword"],
//     }),
// });

// export const refreshAccessTokenSchema = z.object({
//   body: z
//     .object({
//       refreshToken: z.string({ required_error: "Refresh token is required" }),
//     })
//     .optional(),
// });

// Types exported for use in controllers/services if needed
export type RegisterInput = z.infer<typeof registerSchema>["body"];
export type LoginInput = z.infer<typeof loginSchema>["body"];
