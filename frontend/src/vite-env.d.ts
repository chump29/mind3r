interface ViteTypeOptions {
  strictImportMetaEnv: unknown
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

interface ImportMetaEnv {
  readonly DEV: boolean
  readonly PACKAGE_VERSION: string
  readonly VITE_API_URL: string
  readonly VITE_DEBUG: string
  readonly VITE_TITLE: string
}
