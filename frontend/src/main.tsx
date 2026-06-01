import { StrictMode } from "react"

import { error, info } from "@postfmly/logger"

import { MantineProvider } from "@mantine/core"
import { ModalsProvider } from "@mantine/modals"
import { default as ms } from "ms"
import { createRoot } from "react-dom/client"
import { nonEmpty, parseBoolean, pipe, safeParse, string, summarize } from "valibot"

import { default as Display } from "./components/display/index.tsx"
import { findElement, getVersion } from "./components/shared/index.ts"
import { VersionSchema } from "./components/shared/schemas.ts"

const d = safeParse(pipe(string(), nonEmpty(), parseBoolean()), import.meta.env.VITE_DEBUG)
const DEBUG: boolean = d.success ? d.output : false

let version: string = ""
const v = safeParse(VersionSchema, import.meta.env.PACKAGE_VERSION)
if (v.success) {
  version = v.output
} else {
  error("Could not parse UI version", summarize(v.issues))
}

version = await getVersion(version)

if (DEBUG) {
  info(`Got UI version: ${version}`)
}

;(await findElement("#frontend")).textContent = version

const obj: HTMLElement = await findElement("#backend")

// * NOTE: not using await, don't hold up page render
fetch(`${import.meta.env.VITE_API_URL}/version`, {
  signal: AbortSignal.timeout(ms("1s"))
})
  .then(async (response: Response): Promise<string> => {
    if (!response.ok) {
      throw new Error(`Status: ${response.status}`)
    }

    return await response.text()
  })
  .then(async (rawVersion: string): Promise<void> => {
    let version: string = ""
    const v = safeParse(VersionSchema, rawVersion)
    if (v.success) {
      version = v.output
    } else {
      throw new Error("Could not parse API version")
    }

    version = await getVersion(version)

    if (DEBUG) {
      info(`Got API version: ${version}`)
    }

    obj.textContent = version
  })
  .catch((e: unknown): void => {
    obj.textContent = "N/A"
    if (e instanceof Error && (e satisfies Error).name === "TimeoutError") {
      error("Timed out getting API version")
    } else {
      error(e)
    }
  })

if (import.meta.env.DEV) {
  createRoot(await findElement("#root")).render(
    <MantineProvider defaultColorScheme="dark">
      <ModalsProvider>
        <Display />
      </ModalsProvider>
    </MantineProvider>
  )
} else {
  createRoot(await findElement("#root")).render(
    <StrictMode>
      <MantineProvider defaultColorScheme="dark">
        <ModalsProvider>
          <Display />
        </ModalsProvider>
      </MantineProvider>
    </StrictMode>
  )
}
