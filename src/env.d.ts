/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  // tambahkan variable lain kalau perlu
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
