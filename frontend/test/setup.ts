import { afterEach, expect } from "bun:test"

// biome-ignore lint/performance/noNamespaceImport: proper setup
import * as matchers from "@testing-library/jest-dom/matchers"
import { cleanup } from "@testing-library/react"

expect.extend(matchers)

afterEach((): void => {
  cleanup()

  document.body.innerHTML = ""
})
