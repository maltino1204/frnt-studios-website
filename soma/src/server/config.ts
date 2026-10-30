import "server-only";

import { z } from "zod";

/**
 * Typed, lazily parsed environment. See .env.example for every variable.
 * Parsing happens on first use so `next build` works without runtime secrets.
 */
const boolish = z
  .enum(["true", "false", "1", "0", ""])
  .optional()
  .transform((v) => v === "true" || v === "1");

const EnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: z.string().min(1).default("postgres://soma:soma@localhost:5432/soma"),
  DATABASE_POOL_MAX: z.coerce.number().int().min(1).max(50).default(10),
  DATABASE_PREPARE: z.enum(["true", "false"]).default("true").transform((v) => v === "true"),
  AUTH_PROVIDER: z.enum(["local", "supabase"]).default("local"),
  PAYMENTS_PROVIDER: z.enum(["dev", "stripe"]).default("dev"),
  STORAGE_PROVIDER: z.enum(["local", "supabase"]).default("local"),
  EMAIL_PROVIDER: z.enum(["dev", "resend"]).default("dev"),
  DEMO_MODE: boolish,
  APP_URL: z.string().url().default("http://localhost:3000"),
  CRON_SECRET: z.string().optional(),
  UPLOAD_DIR: z.string().default(".data/uploads"),
  NEXT_PUBLIC_SUPABASE_URL: z.string().optional(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().optional(),
  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().default("SOMA <hallo@soma.example>"),
});

export type AppConfig = z.infer<typeof EnvSchema>;

let cached: AppConfig | null = null;

export function getConfig(): AppConfig {
  if (!cached) {
    const parsed = EnvSchema.safeParse(process.env);
    if (!parsed.success) {
      throw new Error(`Ungültige Umgebungsvariablen: ${parsed.error.issues.map((i) => i.path.join(".")).join(", ")}`);
    }
    cached = parsed.data;
  }
  return cached;
}

/** Test hook: forget the parsed environment. */
export function resetConfigCache(): void {
  cached = null;
}

export const isProduction = () => getConfig().NODE_ENV === "production";
