// src/integrations/supabase/client.ts
import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;

function requireEnv(name: string, value?: string) {
  if (!value || value.trim().length === 0) {
    // Log útil no console
    console.error(`[ENV] Missing ${name}. Check your .env at project root and restart dev server.`);
    // Erro claro, sem stack confuso
    throw new Error(`${name} is required`);
  }
  return value;
}

export const supabase = createClient<Database>(
  requireEnv("VITE_SUPABASE_URL", SUPABASE_URL),
  requireEnv("VITE_SUPABASE_PUBLISHABLE_KEY", SUPABASE_PUBLISHABLE_KEY),
  {
    auth: {
      storage: localStorage,
      persistSession: true,
      autoRefreshToken: true,
    },
  }
);
