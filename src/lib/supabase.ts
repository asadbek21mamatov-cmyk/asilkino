import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

// Agar .env.local da Supabase sozlanmagan bo'lsa, sayt LocalStorage (demo) rejimida ishlaydi.
export const supabase: SupabaseClient | null =
  url && key && !url.includes("your-project-ref") ? createClient(url, key) : null;

export const isSupabaseEnabled = supabase !== null;
