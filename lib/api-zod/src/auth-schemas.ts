import { z } from "zod/v4";

export const RegisterRequestSchema = z.object({
  email: z.email(),
  password: z.string().min(8, "Password must be at least 8 characters"),
  name: z.string().min(1, "Name is required"),
});

export const LoginRequestSchema = z.object({
  email: z.email(),
  password: z.string().min(1, "Password is required"),
});

export const OAuthRequestSchema = z.object({
  provider: z.enum(["google", "apple"]),
  idToken: z.string().min(1, "ID token is required"),
  name: z.string().optional(),
});

export const AuthResponseSchema = z.object({
  token: z.string(),
  userId: z.string(),
  email: z.string(),
  hasProfile: z.boolean(),
});
