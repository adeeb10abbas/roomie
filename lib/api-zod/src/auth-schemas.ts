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
  // refreshToken is only included for native clients (X-Client-Type: native header).
  // Web clients receive the refresh token exclusively via an httpOnly cookie.
  refreshToken: z.string().optional(),
  userId: z.string(),
  email: z.string(),
  hasProfile: z.boolean(),
});

export const RefreshRequestSchema = z.object({
  // Native mobile clients send the raw token in the body.
  // Web clients omit it and rely on the httpOnly refresh_token cookie instead.
  refreshToken: z.string().min(1).optional(),
});

export const RefreshResponseSchema = z.object({
  token: z.string(),
  // Only present for native clients (X-Client-Type: native).
  refreshToken: z.string().optional(),
});
