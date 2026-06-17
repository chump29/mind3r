// biome-ignore-all lint/correctness/noUnusedVariables: for Vite environment variables

interface ViteTypeOptions {
  strictImportMetaEnv: unknown
}

interface ImportMetaEnv {
  readonly PACKAGE_VERSION: string
  readonly VITE_API_TIMEOUT: string
  readonly VITE_API_URL: string
  readonly VITE_DEBUG: string
  readonly VITE_TITLE: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
