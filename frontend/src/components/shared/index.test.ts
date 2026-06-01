import { describe, expect, type jest, spyOn, test } from "bun:test"

import { randFutureDate, randNoun, randSemver, randVerb } from "@ngneat/falso"
import { status } from "http-status"
import { titleCase } from "title-case"

import { type IReminder } from "./IReminder.ts"
import { FetchError, findElement, getVersion, handleError, validate } from "./index.ts"

describe("index", (): void => {
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
      event: `${randVerb()} ${randNoun()}`,
      id: null
    } satisfies IReminder
  ]

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

  test("validate", async (): Promise<void> => {
    const reminder: IReminder = reminders[0] as IReminder

    expect(validate<IReminder>(reminder)).resolves.toEqual(remap<IReminder>(reminder))
  })

  test("validate - array", async (): Promise<void> => {
    const validatedReminders: IReminder[] = await validate<IReminder[]>(reminders)

    expect(validatedReminders).toEqual(remap<IReminder[]>(reminders))
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
