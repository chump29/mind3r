import { describe, expect, test } from "bun:test"

import { safeParse } from "valibot"

import { type IUser, vUserSchema } from "../../src/components/shared/IUser.ts"
import { generateUser } from "../helpers.ts"

const user: IUser = {
  user: generateUser()
} satisfies IUser

describe("IUser", async (): Promise<void> => {
  test("should validate object", async (): Promise<void> => {
    expect(safeParse(vUserSchema, user).success).toBeTrue()
  })

  test("should not validate object", (): void => {
    user.user = ""
    const u = safeParse(vUserSchema, user)

    expect(u.success).toBeFalse()
    expect(u.issues?.[0].message).toStartWith("Invalid length")
  })
})
