// server/src/config/supabase.ts
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

// Using the correct backend variable names!
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Fail-safe to prevent silent crashes
if (!supabaseUrl) {
  throw new Error("CRITICAL: SUPABASE_URL is missing from environment variables");
}
if (!supabaseKey) {
  throw new Error("CRITICAL: SUPABASE_SERVICE_ROLE_KEY is missing from environment variables");
}

export const supabaseAdmin = createClient(supabaseUrl, supabaseKey);