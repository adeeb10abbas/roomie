import { z } from "zod/v4";
export declare const RegisterRequestSchema: z.ZodObject<{
    email: z.ZodEmail;
    password: z.ZodString;
    name: z.ZodString;
}, z.core.$strip>;
export declare const LoginRequestSchema: z.ZodObject<{
    email: z.ZodEmail;
    password: z.ZodString;
}, z.core.$strip>;
export declare const OAuthRequestSchema: z.ZodObject<{
    provider: z.ZodEnum<{
        google: "google";
        apple: "apple";
    }>;
    idToken: z.ZodString;
    name: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const AuthResponseSchema: z.ZodObject<{
    token: z.ZodString;
    refreshToken: z.ZodOptional<z.ZodString>;
    userId: z.ZodString;
    email: z.ZodString;
    hasProfile: z.ZodBoolean;
}, z.core.$strip>;
export declare const RefreshRequestSchema: z.ZodObject<{
    refreshToken: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const RefreshResponseSchema: z.ZodObject<{
    token: z.ZodString;
    refreshToken: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
//# sourceMappingURL=auth-schemas.d.ts.map