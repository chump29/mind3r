declare module "bun" {
  interface Env {
    readonly API_TIMEOUT: string
    readonly API_URL: string
    readonly DEBUG: string
    readonly TOKEN: string
  }
}
