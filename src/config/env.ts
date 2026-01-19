import { z } from "zod";

/**
 * Environment Variables Schema
 * Validates availability of critical secrets at runtime.
 */
const envSchema = z.object({
  // Supabase (Required)
  VITE_SUPABASE_URL: z.string().url("VITE_SUPABASE_URL must be a valid URL"),
  VITE_SUPABASE_ANON_KEY: z
    .string()
    .min(1, "VITE_SUPABASE_ANON_KEY is required"),
});

// Validate import.meta.env
// Note: We use safeParse to allow for custom error handling or partial loading if needed,
// but for critical infrastructure like database, we might want to throw early.
const _env = envSchema.safeParse(import.meta.env);

if (!_env.success) {
  console.error("❌ Invalid URL/Key configuration:", _env.error.format());
  // We don't throw immediately to allow the UI to potentially show a clear error specific to the missing keys
  // but the exported 'env' object will be typed correctly, so we need a fallback or re-throw.

  // For critical vars (Supabase), it's safer to throw or let the app know it's in a broken state.
  // However, since typed Env is expected, we'll throw here to prevent runtime undefined errors later.
  throw new Error(
    `Invalid Environment Configuration: ${JSON.stringify(_env.error.format())}`,
  );
}

export const env = _env.data;
