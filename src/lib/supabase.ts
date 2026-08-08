import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://knstaxhomdzcbccjfwpc.supabase.co";
const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtuc3RheGhvbWR6Y2JjY2pmd3BjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYxNzUzMzMsImV4cCI6MjEwMTc1MTMzM30.4uqz5tc-vJ7bgtaAt4shM_jpa37FjcRBPXh1b2zKgi0";

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    flowType: "implicit",
    detectSessionInUrl: true,
  },
});