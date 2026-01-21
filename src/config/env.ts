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

// Validate runtime/build-time env
// Logic: Favor window._env_ (runtime) if available, fallback to import.meta.env (dev/build)

// Define interface for Window to include _env_

const runtimeEnv = typeof window !== "undefined" ? window._env_ || {} : {};
const buildTimeEnv = import.meta.env;

// Merge envs, preferring runtime
const mergedEnv = {
  ...buildTimeEnv,
  ...runtimeEnv,
};

const _env = envSchema.safeParse(mergedEnv);

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
