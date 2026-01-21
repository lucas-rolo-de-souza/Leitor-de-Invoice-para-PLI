/// <reference types="vite/client" />

interface Window {
  _env_: {
    [key: string]: string | undefined;
    VITE_SUPABASE_URL?: string;
    VITE_SUPABASE_ANON_KEY?: string;
    NCM_FILENAME?: string;
  };
}
