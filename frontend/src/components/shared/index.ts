import { error } from "@postfmly/logger"

import { type ArraySchema, array, type SafeParseResult, safeParse, summarize } from "valibot"

import { type IReminder, ReminderSchema } from "./IReminder.ts"

/**
 * Find DOM element
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
 * Validate {@link IReminder} object or array
 * @async
 * @function
 * @param {T} obj IReminder object or array
 * @returns {T} Validated IReminder object or array
 * @throws {Error} If validation fails
 */
const validate = async <T>(obj: T): Promise<T> => {
  let r: SafeParseResult<ReminderSchema | ArraySchema<ReminderSchema, string>>
  if (Array.isArray(obj)) {
    r = safeParse(array(ReminderSchema), obj)
  } else {
    r = safeParse(ReminderSchema, obj)
  }

  if (!r.success) {
    throw new Error(summarize(r.issues))
  }

  return r.output as T
}

/**
 * Show {@link https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API|Fetch API} error message
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
 * Show custom error message
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

type SortOrder = (typeof SortOrder)[keyof typeof SortOrder]

export { FetchError, findElement, getVersion, handleError, SortBy, SortOrder, validate }
