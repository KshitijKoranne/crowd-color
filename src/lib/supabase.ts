import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Create a placeholder client if credentials are missing
// This prevents the app from crashing and allows us to show user-friendly errors
export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null as any; // Fallback to prevent module-level crash

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

// Types for our database
export interface Board {
  id: string;
  title: string;
  description: string | null;
  original_image_url: string;
  thumbnail_url: string | null;
  width: number;
  height: number;
  total_pixels: number;
  colored_pixels: number;
  created_at: string;
  updated_at: string;
}

export interface Pixel {
  id: string;
  board_id: string;
  pixel_index: number;
  r: number;
  g: number;
  b: number;
  a: number;
  updated_at: string;
  updated_by: string | null;
}
