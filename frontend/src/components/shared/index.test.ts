import { describe, expect, type jest, spyOn, test } from "bun:test"

import { GlobalRegistrator } from "@happy-dom/global-registrator"
import { randFutureDate, randSemver, randWord } from "@ngneat/falso"
import { status } from "http-status"

import { type IReminder } from "./IReminder.ts"
import { FetchError, findElement, getURL, getVersion, handleError, validate } from "./index.ts"

GlobalRegistrator.register()

describe("index", (): void => {
  test("getURL", (): void => {
    const bak: string = import.meta.env.VITE_API_URL
    process.env.VITE_API_URL = "http://test.me"

    expect(getURL()).resolves.toBe(`${process.env.VITE_API_URL}/api`)

    process.env.VITE_API_URL = bak
  })

  test("getURL - fail", (): void => {
    const bak: string = import.meta.env.VITE_API_URL
    process.env.VITE_API_URL = ""

    expect(getURL()).resolves.toBeEmpty()

    process.env.VITE_API_URL = bak
  })

  test("findElement", async (): Promise<void> => {
    document.body.innerHTML = '<div id="test">test</div>'

    expect((await findElement("#test")).textContent).toBe("test")
  })

  test("findElement - error", (): void => {
    document.body.innerHTML = "<div>test</div>"

    const element: string = "#test"

    expect(findElement(element)).rejects.toThrowError(`Could not find element: ${element}`)
  })

  test("getVersion", (): void => {
    const version: string = randSemver()

    expect(getVersion(version)).resolves.toBe(`v${version}`)
  })

  test("getVersion - empty", (): void => {
    expect(getVersion(undefined)).resolves.toBe("N/A")
  })

  const reminders: IReminder[] = [
    {
      date: randFutureDate().toISOString(),
      description: null,
      event: randWord({
        capitalize: true
      }),
      id: null
    } satisfies IReminder
  ]

  test("validate", (): void => {
    const reminder: IReminder = reminders[0] as IReminder

    expect(validate(reminder)).resolves.toEqual(reminders[0] as IReminder)
  })

  test("validate - array", (): void => {
    expect(validate(reminders)).resolves.toEqual(reminders)
  })

  test("validate - error", (): void => {
    expect(validate(null)).rejects.toThrowError()
  })

  test("fetchError", (): void => {
    expect.assertions(2)

    try {
      throw new FetchError(
        new Response("", {
          status: status.IM_A_TEAPOT
        })
      )
    } catch (e: unknown) {
      // biome-ignore lint/nursery/noConditionalExpect: testing catch
      expect(e instanceof FetchError).toBeTrue()
      // biome-ignore lint/nursery/noConditionalExpect: testing catch
      expect((e as Error).message).toContain(status.IM_A_TEAPOT.toString())
    }
  })

  test("handleError - timed out", (): void => {
    const errorSpy: jest.Mock = spyOn(console, "error")

    const NUM_TIMES: number = 3

    handleError(new Error("timed out"))

    expect(errorSpy).toHaveBeenCalledTimes(NUM_TIMES)
    expect(errorSpy).toHaveBeenNthCalledWith(2, expect.any(String), "Timed out getting API data")
  })

  test("handleError - error", (): void => {
    const errorSpy: jest.Mock = spyOn(console, "error")

    handleError(new Error())

    expect(errorSpy).toHaveBeenCalled()
  })
})
