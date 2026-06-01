import { error } from "@postfmly/logger"

import { array, safeParse, summarize } from "valibot"

import { type IReminder, ReminderSchema } from "./IReminder.ts"
import { UrlSchema } from "./schemas.ts"

/**
 * Parses VITE_API_URL
 * @async
 * @function
 * @returns {Promise<string>} API URL, or empty string if not found
 */
const getURL = async (): Promise<string> => {
  let API_URL: string = "/api"
  if (import.meta.env.DEV) {
    const u = safeParse(UrlSchema, import.meta.env.VITE_API_URL)
    if (u.success) {
      API_URL = `${u.output}${API_URL}`
    } else {
      API_URL = ""
    }
  }
  return API_URL
}

/**
 * Finds DOM element
 * @async
 * @function
 * @param {string} element - element identifier
 * @returns {Promise<HTMLElement>} DOM element
 * @throws {Error} If element not found
 */
const findElement = async (element: string): Promise<HTMLElement> => {
  const e: HTMLElement | null = document.querySelector(element)
  if (!e) {
    throw new Error(`Could not find element: ${element}`)
  }
  return e
}

/**
 * Format version string
 * @async
 * @function
 * @param {string | undefined} version - version string
 * @returns {Promise<string>} v[version], or N/A if undefined
 */
const getVersion = async (version: string | undefined): Promise<string> => {
  return version ? `v${version}` : "N/A"
}

/**
 * Validates {@link IReminder} object or array
 * @async
 * @function
 * @param {T} reminder Reminder object or array
 * @returns {T} Validated Reminder object or array
 * @throws {Error} If validation fails
 */
const validate = async <T>(reminder: T): Promise<T> => {
  let r
  if (Array.isArray(reminder)) {
    r = safeParse(array(ReminderSchema), reminder)
  } else {
    r = safeParse(ReminderSchema, reminder)
  }

  if (!r.success) {
    throw new Error(summarize(r.issues))
  }

  return r.output as T
}

/**
 * Shows {@link https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API|Fetch API} error message
 * @class
 * @extends Error
 * @param {Response} response {@link https://developer.mozilla.org/en-US/docs/Web/API/Response|Response} object
 */
class FetchError extends Error {
  constructor(response: Response) {
    super(`❌ Error: ${response.status} - ${response.statusText}`)

    this.name = "FetchError"

    Object.setPrototypeOf(this, FetchError.prototype)
  }
}

/**
 * Shows custom error messages
 * @function
 * @param {Error} e The {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error|Error} object
 */
const handleError = (e: Error): void => {
  if (e.message.includes("timed out")) {
    error("Timed out getting API data", e)
  } else {
    error(e)
  }
}

/**
 * Column sort by values
 * @constant
 * @summary DATE | EVENT
 */
const SortBy = Object.freeze({
  DATE: "date",
  EVENT: "event"
})

/**
 * Column sort by types
 * @type {string}
 * @summary date | event
 */
type SortBy = (typeof SortBy)[keyof typeof SortBy]

/**
 * Column sort order values
 * @constant
 * @summary ASC | DESC
 */
const SortOrder = Object.freeze({
  ASC: "asc",
  DESC: "desc"
})

/**
 * Column sort order types
 * @type {string}
 * @summary asc | desc
 */
type SortOrder = (typeof SortOrder)[keyof typeof SortOrder]

export { FetchError, findElement, getURL, getVersion, handleError, SortBy, SortOrder, validate }
