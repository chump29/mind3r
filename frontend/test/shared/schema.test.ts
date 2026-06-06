import { describe, expect, test } from "bun:test"

import { fakerEN_US as fake } from "@faker-js/faker"
import { default as dayjs } from "dayjs"
import { safeParse } from "valibot"

import {
  DateTimeSchema,
  DescriptionSchema,
  EventSchema,
  IdSchema,
  MAX_LEN_DESCRIPTION,
  MAX_LEN_EVENT,
  UserSchema,
  VersionSchema
} from "../../src/components/shared/schemas.ts"
import { generateDescription, generateEvent, generateUser } from "../helpers.ts"

describe("schema", (): void => {
  test("VersionSchema", (): void => {
    expect(safeParse(VersionSchema, fake.system.semver()).success).toBeTrue()
  })

  test("VersionSchema - fail", (): void => {
    const v = safeParse(VersionSchema, "v1")

    expect(v.success).toBeFalse()
    expect(v.issues?.[0].message).toInclude("Invalid SemVer")
  })

  test("DateTimeSchema", (): void => {
    expect(safeParse(DateTimeSchema, fake.date.soon().toISOString()).success).toBeTrue()
  })

  test("DateTimeSchema - fail", (): void => {
    const date: string = dayjs().toISOString()
    const d = safeParse(DateTimeSchema, date)

    expect(d.success).toBeFalse()
    expect(d.issues?.[0].message).toInclude("greater than the current date/time")
  })

  test("EventSchema", (): void => {
    expect(safeParse(EventSchema, generateEvent()).success).toBeTrue()
  })

  test("EventSchema - fail", (): void => {
    const event: string = fake.string.alphanumeric(MAX_LEN_EVENT + 1)
    const e = safeParse(EventSchema, event)

    expect(e.success).toBeFalse()
    expect(e.issues?.[0].message).toInclude(`<=${MAX_LEN_EVENT} but received ${MAX_LEN_EVENT + 1}`)
  })

  test("DescriptionSchema", (): void => {
    expect(safeParse(DescriptionSchema, generateDescription()).success).toBeTrue()
  })

  test("DescriptionSchema - fail", (): void => {
    const description: string = fake.string.alphanumeric(MAX_LEN_DESCRIPTION + 1)
    const d = safeParse(DescriptionSchema, description)

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
    const i = safeParse(IdSchema, id)

    expect(i.success).toBeFalse()
    expect(i.issues?.[0].message).toInclude(">0")
  })

  test("UserSchema", (): void => {
    expect(safeParse(UserSchema, generateUser()).success).toBeTrue()
  })

  test("UserSchema - fail", (): void => {
    const user: string = " "
    const u = safeParse(UserSchema, user)

    expect(u.success).toBeFalse()
    expect(u.issues?.[0].message).toInclude("Invalid length")
  })
})
