import { z } from "zod";

export const loginSchema = z.object({
  email: z
    .string()
    .nonempty("Email is required")
    .pipe(z.email("Invalid email address")), 

  password: z
    .string()
    .nonempty("Password is required")
    .pipe(
      z.string().min(6, "Password must be at least 6 characters")
    ),
});