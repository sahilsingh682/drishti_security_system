// This file is updated to use Native Supabase Google Auth
import { supabase } from "../supabase/client";

type SignInOptions = {
  redirect_uri?: string;
};

export const lovable = {
  auth: {
    // 🚀 Professional Supabase Google Auth
    signInWithOAuth: async (provider: "google" | "apple", opts?: SignInOptions) => {
      try {
        const { data, error } = await supabase.auth.signInWithOAuth({
          provider: provider,
          options: {
            // Jahan user login ke baad wapas aayega (e.g., your dashboard URL)
            redirectTo: opts?.redirect_uri || window.location.origin,
            queryParams: {
              access_type: 'offline',
              prompt: 'select_account',
            },
          },
        });

        if (error) {
          console.error("Auth Error:", error.message);
          return { error };
        }

        return { data, redirected: true };
      } catch (e) {
        return { error: e instanceof Error ? e : new Error(String(e)) };
      }
    },

    // Session check karne ke liye helper
    signOut: async () => {
      const { error } = await supabase.auth.signOut();
      if (!error) {
        window.location.href = "/"; // Sign out ke baad home par bhej do
      }
      return { error };
    }
  },
};