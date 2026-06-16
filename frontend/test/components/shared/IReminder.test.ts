import { describe, expect, test } from "bun:test"

import { type SafeParseResult, safeParse } from "valibot"

import { type IReminder, ReminderSchema } from "../../../src/components/shared/IReminder.ts"
import { generateReminder } from "../../fakes.ts"

describe("IReminder", (): void => {
  const reminder: IReminder = generateReminder()

  test("should validate object", (): void => {
    expect(safeParse(ReminderSchema, reminder).success).toBeTrue()
  })

  test("should not validate object", (): void => {
    reminder.event = ""
    const r: SafeParseResult<ReminderSchema> = safeParse(ReminderSchema, reminder)

    expect(r.success).toBeFalse()
    expect(r.issues?.[0].message).toBe("This field is required")
  })
})
