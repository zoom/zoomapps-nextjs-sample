import { createBrowserClient } from "@supabase/ssr";

export const createClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey || supabaseUrl.includes('your_supabase_url_here') || supabaseKey.includes('your_supabase_anon_key_here')) {
    throw new Error("Supabase URL and API key are required and must be valid. Please check your environment variables.");
  }

  return createBrowserClient(supabaseUrl, supabaseKey);
};
