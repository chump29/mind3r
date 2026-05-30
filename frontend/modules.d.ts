declare module "bun" {
  interface Env {
    VITE_API_URL: string
    VITE_DEBUG: string
    VITE_TITLE: string
  }
}
