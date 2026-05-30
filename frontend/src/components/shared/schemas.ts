import { default as dayjs } from "dayjs"
import { default as utc } from "dayjs/plugin/utc"
import { valid } from "semver"
import { titleCase } from "title-case"
import {
  type CheckIssue,
  check,
  gtValue,
  integer,
  isoTimestamp,
  maxLength,
  minValue,
  nonEmpty,
  nullable,
  number,
  pipe,
  string,
  toLowerCase,
  transform,
  trim,
  url
} from "valibot"

dayjs.extend(utc)

/**
 * Validates against Semantic Versioning Specification
 * @constant
 * @summary non-empty string, valid {@link https://semver.org/|SemVer}
 */
const VersionSchema = pipe(
  string(),
  nonEmpty(),
  transform((s: string): string => s.replaceAll('"', "")),
  check(
    (s: string): boolean => (valid(s) ? true : false),
    (e: CheckIssue<string>): string => `Invalid SemVer: ${e.input}`
  )
)

/**
 * Validates a URL
 * @constant
 * @summary non-empty string, valid URL
 */
const UrlSchema = pipe(string(), nonEmpty(), toLowerCase(), url())

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
 * Validates date/time
 * @constant
 * @summary non-empty string, valid UTC {@link https://www.iso.org/iso-8601-date-and-time-format.html|ISO 8601} date-time
 */
const DateTimeSchema = pipe(
  string(),
  nonEmpty("This field is required"),
  transform((s: string): string => dayjs(s).utc().toISOString()),
  isoTimestamp(),
  minValue(dayjs().add(1, "m").toISOString(), "Must be greater than the current date/time")
)

/**
 * Validates event title
 * @constant
 * @summary non-empty string, max length = MAX_LEN_EVENT
 */
const EventSchema = pipe(
  string(),
  nonEmpty("This field is required"),
  maxLength(MAX_LEN_EVENT),
  transform((s: string): string => titleCase(s))
)

/**
 * Validates description
 * @constant
 * @summary null | non-empty string, max length = MAX_LEN_DESCRIPTION
 */
const DescriptionSchema = nullable(
  pipe(
    string(),
    nonEmpty(),
    trim(),
    maxLength(MAX_LEN_DESCRIPTION),
    transform((s: string): string | null => (!s.length ? null : s))
  )
)

/**
 * Validates ID
 * @constant
 * @summary null | positive integer
 * @default null
 */
const IdSchema = nullable(pipe(number(), integer(), gtValue(0)), null)

export {
  DATETIME_FORMAT,
  DateTimeSchema,
  DescriptionSchema,
  EventSchema,
  IdSchema,
  MAX_LEN_DESCRIPTION,
  MAX_LEN_EVENT,
  UrlSchema,
  VersionSchema
}
