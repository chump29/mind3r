import { describe, expect, type jest, spyOn, test } from "bun:test"

import { fakerEN_US as fake } from "@faker-js/faker"
import { status } from "http-status"
import { titleCase } from "title-case"

import { type IReminder } from "../../src/components/shared/IReminder.ts"
import { FetchError, findElement, getVersion, handleError, validate } from "../../src/components/shared/index.ts"
import { generateReminder, generateReminders } from "../helpers.ts"

describe("index", (): void => {
  test("findElement", (): void => {
    document.body.innerHTML = '<div id="test">test</div>'

    expect(findElement("#test")?.textContent).toBe("test")
  })

  test("findElement - fail", (): void => {
    expect(findElement("#nop")).toBeNull()
  })

  test("getVersion", (): void => {
    const version: string = fake.system.semver()

    expect(getVersion(version)).toBe(`v${version}`)
  })

  test("getVersion - empty", (): void => {
    expect(getVersion(undefined)).toBe("N/A")
  })

  // * NOTE: remapping because of case transformation on event title
  const remap = <T>(obj: T): T => {
    if (Array.isArray(obj)) {
      return obj.map((reminder: IReminder): IReminder => {
        return {
          ...reminder,
          event: titleCase(reminder.event)
        }
      }) as T
    } else {
      return {
        ...obj,
        event: titleCase((obj as IReminder).event)
      } as T
    }
  }

  test("validate", (): void => {
    const reminder: IReminder = generateReminder()

    expect(validate<IReminder>(reminder)).toEqual(remap<IReminder>(reminder))
  })

  test("validate - array", (): void => {
    const reminders: IReminder[] = generateReminders()

    const validatedReminders: IReminder[] = validate<IReminder[]>(reminders)

    expect(validatedReminders).toEqual(remap<IReminder[]>(reminders))
  })

  test("validate - error", (): void => {
    expect((): null => validate(null)).toThrowError()
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
