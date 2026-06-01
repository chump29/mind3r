import { describe, expect, test } from "bun:test"

import { randCatchPhrase, randNumber, randSemver, randSoonDate, randText, randUrl, randWord } from "@ngneat/falso"
import dayjs from "dayjs"
import { safeParse } from "valibot"

import {
  DateTimeSchema,
  DescriptionSchema,
  EventSchema,
  IdSchema,
  MAX_LEN_DESCRIPTION,
  MAX_LEN_EVENT,
  UrlSchema,
  VersionSchema
} from "./schemas.ts"

describe("schema", (): void => {
  test("VersionSchema", (): void => {
    expect(safeParse(VersionSchema, randSemver()).success).toBeTrue()
  })

  test("VersionSchema - fail", (): void => {
    const v = safeParse(VersionSchema, "v1")

    expect(v.success).toBeFalse()
    expect(v.issues?.[0].message).toInclude("Invalid SemVer")
  })

  test("UrlSchema", (): void => {
    expect(safeParse(UrlSchema, randUrl()).success).toBeTrue()
  })

  test("UrlSchema - fail", (): void => {
    const u = safeParse(UrlSchema, "not_a_url")

    expect(u.success).toBeFalse()
    expect(u.issues?.[0].message).toInclude("Invalid URL")
  })

  test("DateTimeSchema", (): void => {
    expect(safeParse(DateTimeSchema, randSoonDate().toISOString()).success).toBeTrue()
  })

  test("DateTimeSchema - fail", (): void => {
    const date: string = dayjs().toISOString()
    const d = safeParse(DateTimeSchema, date)

    expect(d.success).toBeFalse()
    expect(d.issues?.[0].message).toInclude("greater than the current date/time")
  })

  test("EventSchema", (): void => {
    expect(
      safeParse(
        EventSchema,
        randWord({
          capitalize: true
        })
      ).success
    ).toBeTrue()
  })

  test("EventSchema - fail", (): void => {
    const event: string = randText({
      charCount: MAX_LEN_EVENT + 1
    })
    const e = safeParse(EventSchema, event)

    expect(e.success).toBeFalse()
    expect(e.issues?.[0].message).toInclude(`<=${MAX_LEN_EVENT} but received ${MAX_LEN_EVENT + 1}`)
  })

  test("DescriptionSchema", (): void => {
    expect(safeParse(DescriptionSchema, randCatchPhrase()).success).toBeTrue()
  })

  test("DescriptionSchema - fail", (): void => {
    const description: string = randText({
      charCount: MAX_LEN_DESCRIPTION + 1
    })
    const d = safeParse(DescriptionSchema, description)

    expect(d.success).toBeFalse()
    expect(d.issues?.[0].message).toInclude(`<=${MAX_LEN_DESCRIPTION} but received ${MAX_LEN_DESCRIPTION + 1}`)
  })

  test("IdSchema", (): void => {
    expect(
      safeParse(
        IdSchema,
        randNumber({
          min: 1
        })
      ).success
    ).toBeTrue()
  })

  test("IdSchema - fail", (): void => {
    const id: number = 0
    const i = safeParse(IdSchema, id)

    expect(i.success).toBeFalse()
    expect(i.issues?.[0].message).toInclude(">0")
  })
})
