// env.d.ts
/// <reference types="vite/client" />
/// <reference types="unplugin-vue-router/client" />

interface ImportMetaEnv {
  readonly SUPABASE_URL_2024: string
  readonly SUPABASE_KEY_2024: string

  readonly VITE_BUILD_KEY: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
