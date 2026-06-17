import { describe, expect, test } from "bun:test"

import { UnsecuredJWT, type UnsecuredResult } from "jose"

import { getHeaders } from "../../../src/components/shared/jwt.ts"
import { generateUser } from "../../fakes.ts"

describe("jwt", (): void => {
  test("getHeaders", (): void => {
    const userName: string = generateUser()

    const headers: HeadersInit | undefined = getHeaders(userName)

    expect(headers).not.toBeUndefined()

    const token: string = new Headers(headers).get("Authorization")?.split(" ")[1] ?? ""

    expect(token).not.toHaveLength(0)

    const jwt: UnsecuredResult = UnsecuredJWT.decode(token, {
      subject: userName
    })

    expect(jwt.payload.sub).toBe(userName)
  })

  test("getHeaders - fail", (): void => {
    const headers: HeadersInit | undefined = getHeaders("")

    expect(headers).toBeUndefined()
  })
})
