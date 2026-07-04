import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  "https://wucxfpinzsqfsnkvtdcr.supabase.co";

const supabaseAnonKey =
  "sb_publishable_EMgnn_QsIxjyULvTKKUCxQ_d9KAWifE";

export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey,
);
