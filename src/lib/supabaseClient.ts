import { createClient } from '@supabase/supabase-js';

// Konfigurasi Supabase
// URL Project: https://jyvjvixxdhonjhsnejmc.supabase.co
// Database Password: silambat123A
// 
// PENTING: Ganti SUPABASE_ANON_KEY dengan anon/public key dari:
// Supabase Dashboard → Settings → API → anon/public key

const supabaseUrl = 'https://jyvjvixxdhonjhsnejmc.supabase.co';

// Temporary anon key - HARUS DIGANTI dengan key yang benar dari Supabase Dashboard
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp5dmp2aXh4ZGhvbmpoc25lam1jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA4NDMzNzYsImV4cCI6MjA3NjQxOTM3Nn0.L0xbvhnz2Tt7IZbtV3Jv06opCQ9lndXxDfgORhPQyqs';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
