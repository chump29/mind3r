import { StrictMode } from "react"

import { error, info } from "@postfmly/logger"

import { MantineProvider } from "@mantine/core"
import { ModalsProvider } from "@mantine/modals"
import { default as ms } from "ms"
import { createRoot } from "react-dom/client"
import { type SafeParseResult, safeParse, summarize } from "valibot"

import { default as Display } from "./components/display/index.tsx"
import { findElement, getVersion } from "./components/shared/index.ts"
import { BooleanSchema, TimeoutSchema, UrlSchema, VersionSchema } from "./components/shared/schemas.ts"

const debug: SafeParseResult<BooleanSchema> = safeParse(BooleanSchema, import.meta.env.VITE_DEBUG)
const DEBUG: boolean = debug.success ? debug.output : false

let uiVersion: string = ""
const validatedUiVersion: SafeParseResult<VersionSchema> = safeParse(VersionSchema, import.meta.env.PACKAGE_VERSION)
if (validatedUiVersion.success) {
  uiVersion = validatedUiVersion.output
} else {
  error("Could not parse UI version", summarize(validatedUiVersion.issues))
}

uiVersion = getVersion(uiVersion)

if (DEBUG) {
  info(`Got UI version: ${uiVersion}`)
}

const frontend: HTMLElement | null = findElement("#frontend")
if (frontend) {
  frontend.textContent = uiVersion
} else {
  error("Could not find frontend version element")
}

const backend: HTMLElement | null = findElement("#backend")
if (!backend) {
  error("Could not find backend version element")
}

const api_url: SafeParseResult<UrlSchema> = safeParse(UrlSchema, import.meta.env.VITE_API_URL)
const API_URL: string = `${api_url.success ? api_url.output : ""}/api`

const api_timeout: SafeParseResult<TimeoutSchema> = safeParse(TimeoutSchema, import.meta.env.VITE_API_TIMEOUT)
const API_TIMEOUT: number = api_timeout.success ? api_timeout.output : ms("1s")

// * NOTE: not using await, don't hold up page render
fetch(`${API_URL}/version`, {
  signal: AbortSignal.timeout(API_TIMEOUT)
})
  .then(async (response: Response): Promise<string> => {
    if (!response.ok) {
      throw new Error(`Status: ${response.status}`)
    }

    return await response.text()
  })
  .then((rawVersion: string): void => {
    let apiVersion: string = ""
    const validatedApiVersion: SafeParseResult<VersionSchema> = safeParse(VersionSchema, rawVersion)
    if (validatedApiVersion.success) {
      apiVersion = validatedApiVersion.output
    } else {
      throw new Error("Could not parse API version")
    }

    apiVersion = getVersion(apiVersion)

    if (DEBUG) {
      info(`Got API version: ${apiVersion}`)
    }

    if (backend) {
      backend.textContent = apiVersion
    }
  })
  .catch((e: unknown): void => {
    if (backend) {
      backend.textContent = "N/A"
    }

    if (e instanceof Error && (e satisfies Error).name === "TimeoutError") {
      error("Timed out getting API version")
    } else {
      error(e)
    }
  })

const root: HTMLElement | null = findElement("#root")
if (root) {
  createRoot(root).render(
    <StrictMode>
      <MantineProvider defaultColorScheme="dark">
        <ModalsProvider>
          <Display />
        </ModalsProvider>
      </MantineProvider>
    </StrictMode>
  )
} else {
  error("Could not find root element")
}
