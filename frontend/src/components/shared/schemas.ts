import { default as dayjs } from "dayjs"
import { default as utc } from "dayjs/plugin/utc"
import { default as ms, type StringValue } from "ms"
import { valid } from "semver"
import { titleCase } from "title-case"
import {
  type CheckIssue,
  check,
  gtValue,
  integer,
  maxLength,
  minValue,
  nonEmpty,
  nullable,
  number,
  pipe,
  regex,
  string,
  toBoolean,
  transform,
  trim,
  unknown,
  url
} from "valibot"

dayjs.extend(utc)

/**
 * Validate against Semantic Versioning Specification
 * @function
 * @summary non-empty string, valid {@link https://semver.org/ SemVer}
 */
const VersionSchema = pipe(
  string(),
  trim(),
  nonEmpty(),
  transform((s: string): string => s.replaceAll('"', "")),
  check(
    (s: string): boolean => valid(s) !== null,
    (e: CheckIssue<string>): string => `Invalid SemVer: ${e.input}`
  )
)

type VersionSchema = typeof VersionSchema

/**
 * Maximum description length
 * @constant
 * @type {number}
 * @default 255
 */
const MAX_LEN_DESCRIPTION: number = 255

/**
 * Maximum event title length
 * @constant
 * @type {number}
 * @default 50
 */
const MAX_LEN_EVENT: number = 50

/**
 * Custom date/time format
 * @constant
 * @type {string}
 * @example Monday, May 25th @ 8:04 AM
 */
const DATETIME_FORMAT: string = "dddd, MMMM Do @ h:mm A"

/**
 * Round to nearest minutes
 * @constant
 * @type {number}
 * @default 5
 */
const ROUND_TO_NEAREST_MINUTES: number = 5

/**
 * Gets date/time
 * @function
 * @returns {string} The date/time
 * @summary Rounds up to nearest {@link ROUND_TO_NEAREST_MINUTES} minutes
 */
const getDateTime = (): string => {
  let date: dayjs.Dayjs = dayjs()

  const nextMinutes: number = Math.ceil(date.minute() / ROUND_TO_NEAREST_MINUTES) * ROUND_TO_NEAREST_MINUTES
  date = nextMinutes === 60 ? date.add(1, "hours").startOf("hours") : date.minute(nextMinutes).startOf("minutes")

  if (dayjs().minute() === date.minute()) {
    date = date.add(ROUND_TO_NEAREST_MINUTES, "minutes")
  }

  return date.toISOString()
}

/**
 * Validate date-time
 * @function
 * @summary non-empty string, valid UTC {@link https://www.iso.org/iso-8601-date-and-time-format.html ISO 8601} date-time
 */
const DateTimeSchema = pipe(
  string(),
  nonEmpty(),
  transform((s: string): string => dayjs(s).utc().toISOString())
)

type DateTimeSchema = typeof DateTimeSchema

/**
 * Validate event title
 * @function
 * @summary non-empty string, max length = {@link MAX_LEN_EVENT}
 */
const EventSchema = pipe(
  string(),
  trim(),
  nonEmpty("This field is required"),
  maxLength(MAX_LEN_EVENT),
  transform((s: string): string => titleCase(s))
)

type EventSchema = typeof EventSchema

/**
 * Validate description
 * @function
 * @summary null | non-empty string, max length = {@link MAX_LEN_DESCRIPTION}
 * @default null
 */
const DescriptionSchema = nullable(
  pipe(
    string(),
    trim(),
    nonEmpty(),
    maxLength(MAX_LEN_DESCRIPTION),
    transform((s: string): string | null => (s.length > 0 ? s : null))
  )
)

type DescriptionSchema = typeof DescriptionSchema

/**
 * Validate ID
 * @constant
 * @summary null | positive integer
 * @default null
 */
const IdSchema = nullable(pipe(number(), integer(), gtValue(0)))

type IdSchema = typeof IdSchema

/**
 * Maximum search length
 * @constant
 * @type {number}
 * @default 50
 */
const MAX_LEN_SEARCH: number = 50

/**
 * Maximum name length
 * @constant
 * @type {number}
 * @default 50
 */
const MAX_LEN_NAME: number = 20

/**
 * Validate user
 * @function
 * @summary non-empty string, max length = {@link MAX_LEN_NAME}
 * @default null
 */
const UserSchema = nullable(
  pipe(
    string(),
    trim(),
    nonEmpty(),
    maxLength(MAX_LEN_NAME),
    transform((s: string): string => s.replaceAll('"', ""))
  )
)

type UserSchema = typeof UserSchema

/**
 * Validate search
 * @function
 * @summary printable ASCII string, max length = {@link MAX_LEN_SEARCH}
 */
const SearchSchema = pipe(
  string(),
  trim(),
  maxLength(MAX_LEN_SEARCH),
  transform((s: string): string => s.replace(/[^\x20-\x7E]/g, ""))
)

type SearchSchema = typeof SearchSchema

/**
 * Validate boolean
 * @function
 * @summary valid boolean {@link https://developer.mozilla.org/en-US/docs/Glossary/Truthy value}
 */
const BooleanSchema = pipe(unknown(), toBoolean())

type BooleanSchema = typeof BooleanSchema

/**
 * Validate URL
 * @function
 * @summary valid {@link https://datatracker.ietf.org/doc/html/rfc3986 URL}
 */
const UrlSchema = pipe(string(), trim(), nonEmpty(), url())

type UrlSchema = typeof UrlSchema

const MIN_TIMEOUT: number = 200

/**
 * Validate API timeout
 * @function
 * @summary Converts string to milliseconds, min value = {@link MIN_TIMEOUT} ms
 */
const TimeoutSchema = pipe(
  string(),
  trim(),
  nonEmpty(),
  regex(/^\d+\w+$/i),
  transform((s: string): number => ms(s as StringValue)),
  minValue(MIN_TIMEOUT)
)

type TimeoutSchema = typeof TimeoutSchema

export {
  BooleanSchema,
  DATETIME_FORMAT,
  DateTimeSchema,
  DescriptionSchema,
  EventSchema,
  getDateTime,
  IdSchema,
  MAX_LEN_DESCRIPTION,
  MAX_LEN_EVENT,
  MAX_LEN_NAME,
  MAX_LEN_SEARCH,
  ROUND_TO_NEAREST_MINUTES, // for testing
  SearchSchema,
  TimeoutSchema,
  UrlSchema,
  UserSchema,
  VersionSchema
}
