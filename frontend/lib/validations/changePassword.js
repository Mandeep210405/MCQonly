import { z } from "zod";

export const changePasswordSchema = z.object({
    currentPassword: z.string().min(1, "Current Password is required"),
    newPassword: z.string().min(1, "New Password is required"),
    confirmPassword: z.string().min(1, "Confirm Password is required")
}).refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
});