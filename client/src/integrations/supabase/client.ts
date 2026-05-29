import { createClient } from '@supabase/supabase-js';
import type { Database } from './types'; // Assumes you have your types file here

// 1. Read the environment variables exactly as named in client/.env
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// 2. Add safety checks to instantly warn you if the .env file is missing
if (!supabaseUrl) {
  throw new Error("Missing VITE_SUPABASE_URL in client/.env file");
}
if (!supabaseAnonKey) {
  throw new Error("Missing VITE_SUPABASE_ANON_KEY in client/.env file");
}

// 3. Export the connected client
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);