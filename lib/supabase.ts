import { createClient } from '@supabase/supabase-js';

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ibvttbwpnwjkwqmtrpzv.supabase.co';

const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlidnR0Yndwbndqa3dxbXRycHp2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkzODYxMDYsImV4cCI6MjEwNDk2MjEwNn0.daZoQYogXHlUn4nDf3V3CLu3udXhPdsLq6kAcTbG5Ag';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
