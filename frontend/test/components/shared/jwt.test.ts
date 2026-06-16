import { describe, expect, test } from "bun:test"

import { jwtVerify } from "jose/jwt/verify"

import { getHeaders } from "../../../src/components/shared/jwt.ts"
import { generateUser } from "../../fakes.ts"

describe("jwt", (): void => {
  const userName: string = generateUser()

  test("getHeaders", async (): Promise<void> => {
    const headers: HeadersInit | undefined = await getHeaders(userName)

    expect(headers).not.toBeUndefined()

    const token: string | null = new Headers(headers).get("Authorization")

    expect(token).not.toBeNull()

    await jwtVerify(token?.split(" ")[1] ?? "", new TextEncoder().encode(Bun.env.TOKEN), {
      subject: userName,
      typ: "JWT",
      algorithms: [
        "HS256"
      ]
    })
  })
})
