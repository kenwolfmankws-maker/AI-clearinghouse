import { createClient } from '@supabase/supabase-js';

// Check localStorage first, then fall back to env variables
const getSupabaseUrl = () => {
  return localStorage.getItem('supabase_url') || 
         import.meta.env.VITE_SUPABASE_URL || 
         'https://renuhdmxolunjqjbslga.supabase.co';
};

const getSupabaseKey = () => {
  return localStorage.getItem('supabase_anon_key') || 
         import.meta.env.VITE_SUPABASE_ANON_KEY || 
         '';
};

const supabaseUrl = getSupabaseUrl();
const supabaseKey = getSupabaseKey();

export const supabase = createClient(supabaseUrl, supabaseKey);

export const hasValidCredentials = () => {
  const url = getSupabaseUrl();
  const key = getSupabaseKey();
  return url && key && key.length > 20;
};
