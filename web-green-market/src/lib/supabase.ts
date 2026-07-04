import { createClient } from "@supabase/supabase-js";

export function getSupabase(env: { SUPABASE_SERVICE_KEY: string }) {
  return createClient(
    "https://wucxfpinzsqfsnkvtdcr.supabase.co",
    env.SUPABASE_SERVICE_KEY,
  );
}
