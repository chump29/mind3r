import { describe, expect, test } from "bun:test"

import { randFutureDate, randWord } from "@ngneat/falso"
import { safeParse } from "valibot"

import { type IReminder, ReminderSchema } from "./IReminder.ts"

describe("IReminder", (): void => {
  const reminder: IReminder = {
    date: randFutureDate().toISOString(),
    description: null,
    event: randWord({
      capitalize: true
    }),
    id: null
  } satisfies IReminder

  test("should validate object", async (): Promise<void> => {
    expect(safeParse(ReminderSchema, reminder).success).toBeTrue()
  })

  test("should not validate object", (): void => {
    reminder.event = ""
    const r = safeParse(ReminderSchema, reminder)

    expect(r.success).toBeFalse()
    expect(r.issues?.[0].message).toBe("This field is required")
  })
})
