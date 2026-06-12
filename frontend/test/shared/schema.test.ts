import { describe, expect, test } from "bun:test"

import { fakerEN_US as fake } from "@faker-js/faker"
import { default as dayjs } from "dayjs"
import { type SafeParseResult, safeParse } from "valibot"

import {
  BooleanSchema,
  DateTimeSchema,
  DescriptionSchema,
  EventSchema,
  IdSchema,
  MAX_LEN_DESCRIPTION,
  MAX_LEN_EVENT,
  MAX_LEN_SEARCH,
  SearchSchema,
  TimeoutSchema,
  UrlSchema,
  UserSchema,
  VersionSchema
} from "../../src/components/shared/schemas.ts"
import { generateDescription, generateEvent, generateUser } from "../helpers.ts"

describe("schema", (): void => {
  test("VersionSchema", (): void => {
    expect(safeParse(VersionSchema, fake.system.semver()).success).toBeTrue()
  })

  test("VersionSchema - fail", (): void => {
    const v: SafeParseResult<VersionSchema> = safeParse(VersionSchema, "v1")

    expect(v.success).toBeFalse()
    expect(v.issues?.[0].message).toStartWith("Invalid SemVer")
  })

  test("DateTimeSchema", (): void => {
    expect(safeParse(DateTimeSchema, fake.date.soon().toISOString()).success).toBeTrue()
  })

  test("DateTimeSchema - fail", (): void => {
    const date: string = dayjs().toISOString()
    const d: SafeParseResult<DateTimeSchema> = safeParse(DateTimeSchema, date)

    expect(d.success).toBeFalse()
    expect(d.issues?.[0].message).toStartWith("Invalid value")
  })

  test("EventSchema", (): void => {
    expect(safeParse(EventSchema, generateEvent()).success).toBeTrue()
  })

  test("EventSchema - fail", (): void => {
    const event: string = fake.string.alphanumeric(MAX_LEN_EVENT + 1)
    const e: SafeParseResult<EventSchema> = safeParse(EventSchema, event)

    expect(e.success).toBeFalse()
    expect(e.issues?.[0].message).toInclude(`<=${MAX_LEN_EVENT} but received ${MAX_LEN_EVENT + 1}`)
  })

  test("DescriptionSchema", (): void => {
    expect(safeParse(DescriptionSchema, generateDescription()).success).toBeTrue()
  })

  test("DescriptionSchema - fail", (): void => {
    const description: string = fake.string.alphanumeric(MAX_LEN_DESCRIPTION + 1)
    const d: SafeParseResult<DescriptionSchema> = safeParse(DescriptionSchema, description)

    expect(d.success).toBeFalse()
    expect(d.issues?.[0].message).toInclude(`<=${MAX_LEN_DESCRIPTION} but received ${MAX_LEN_DESCRIPTION + 1}`)
  })

  test("IdSchema", (): void => {
    expect(
      safeParse(
        IdSchema,
        fake.number.int({
          min: 1
        })
      ).success
    ).toBeTrue()
  })

  test("IdSchema - fail", (): void => {
    const id: number = 0
    const i: SafeParseResult<IdSchema> = safeParse(IdSchema, id)

    expect(i.success).toBeFalse()
    expect(i.issues?.[0].message).toInclude(">0")
  })

  test("UserSchema", (): void => {
    expect(safeParse(UserSchema, generateUser()).success).toBeTrue()
  })

  test("UserSchema - fail", (): void => {
    const user: string = " "
    const u: SafeParseResult<UserSchema> = safeParse(UserSchema, user)

    expect(u.success).toBeFalse()
    expect(u.issues?.[0].message).toStartWith("Invalid length")
  })

  test("SearchSchema", (): void => {
    expect(safeParse(SearchSchema, fake.word.sample()).success).toBeTrue()
  })

  test("SearchSchema - strip", (): void => {
    const search: string = "\x07" // BEL
    const s: SafeParseResult<SearchSchema> = safeParse(SearchSchema, search)

    expect(s.success).toBeTrue()
    expect(s.output).toHaveLength(0)
  })

  test("SearchSchema - fail", (): void => {
    const search: string = fake.string.alphanumeric(MAX_LEN_SEARCH + 1)
    const s: SafeParseResult<SearchSchema> = safeParse(SearchSchema, search)

    expect(s.success).toBeFalse()
    expect(s.issues?.[0].message).toStartWith("Invalid length")
  })

  // biome-ignore-start lint/suspicious/noExplicitAny: allow for testing
  test("BooleanSchema - true", (): void => {
    const bools: any[] = [
      true,
      fake.number.int({
        min: 1
      }),
      fake.number.bigInt({
        min: 1
      }),
      fake.number.float({
        max: Number.MAX_VALUE,
        min: Number.MIN_VALUE
      }),
      fake.number.int({
        max: -Number.MIN_VALUE,
        min: Number.MIN_SAFE_INTEGER
      }),
      fake.number.float({
        max: -Number.MIN_VALUE,
        min: -Number.MAX_VALUE
      }),
      fake.word.sample(),
      [] as any[],
      {} as any
    ]

    for (const bool of bools) {
      const b: SafeParseResult<BooleanSchema> = safeParse(BooleanSchema, bool)

      expect(b.success).toBeTrue()
      expect(b.output).toBeTrue()
    }
  })

  test("BooleanSchema - false", (): void => {
    const bools: any[] = [
      false,
      0,
      -0,
      0n,
      "",
      null,
      undefined,
      Number.NaN
    ]

    for (const bool of bools) {
      const b: SafeParseResult<BooleanSchema> = safeParse(BooleanSchema, bool)

      expect(b.success).toBeTrue()
      expect(b.output).toBeFalse()
    }
  })
  // biome-ignore-end lint/suspicious/noExplicitAny: allow for testing

  test("UrlSchema", (): void => {
    expect(safeParse(UrlSchema, fake.internet.url()).success).toBeTrue()
  })

  test("UrlSchema - fail", (): void => {
    const url: string = "bad/url"
    const u: SafeParseResult<UrlSchema> = safeParse(UrlSchema, url)

    expect(u.success).toBeFalse()
    expect(u.issues?.[0].message).toStartWith("Invalid URL")
  })

  test("TimeoutSchema", (): void => {
    expect(
      safeParse(
        TimeoutSchema,
        fake.number.int({
          min: 1
        })
      )
    )
  })

  test("TimeoutSchema - fail format", (): void => {
    const timeout: string = "0"
    const t: SafeParseResult<TimeoutSchema> = safeParse(TimeoutSchema, timeout)

    expect(t.success).toBeFalse()
    expect(t.issues?.[0].message).toStartWith("Invalid format")
  })

  test("TimeoutSchema - fail number", (): void => {
    const timeout: string = "0s"
    const t: SafeParseResult<TimeoutSchema> = safeParse(TimeoutSchema, timeout)

    expect(t.success).toBeFalse()
    expect(t.issues?.[0].message).toContain(">=200")
  })
})
