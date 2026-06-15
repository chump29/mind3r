import { fakerEN_US as fake } from "@faker-js/faker"
import { default as truncate } from "truncate"

import { type IReminder } from "../src/components/shared/IReminder.ts"
import { validate } from "../src/components/shared/index.ts"
import { MAX_LEN_DESCRIPTION, MAX_LEN_EVENT } from "../src/components/shared/schemas.ts"

/**
 * Generate fake event title
 * @function
 * @summary Truncated to {@link MAX_LEN_EVENT}
 * @returns {string} Event title
 */
const generateEvent = (): string => truncate(fake.company.buzzPhrase(), MAX_LEN_EVENT)

/**
 * Generate fake event description
 * @function
 * @summary Truncated to {@link MAX_LEN_DESCRIPTION}
 * @returns {string} Event description
 */
const generateDescription = (): string => truncate(fake.lorem.sentence(), MAX_LEN_DESCRIPTION)

/**
 * Generate fake user name
 * @function
 * @returns {string} User name
 */
const generateUser = (): string => fake.person.firstName("generic")

let MAX_ID: number = 1

const reminderData = (): IReminder =>
  ({
    date: fake.date.future().toISOString(),
    description: `${truncate(fake.lorem.sentence(), MAX_LEN_DESCRIPTION)}\n${fake.internet.email()}`,
    event: truncate(fake.company.buzzPhrase(), MAX_LEN_EVENT),
    id: MAX_ID++,
    user: generateUser()
  }) satisfies IReminder

/**
 * Generate fake Reminder data
 * @async
 * @function
 * @returns {IReminder} Reminder data
 */
const generateReminder = (): IReminder => validate(reminderData())

const DEFAULT_NUM_REMINDERS: number = 3

/**
 * Generate fake array of Reminder data
 * @function
 * @param {number} [num=3] - The number of Reminder objects
 * @returns {IReminder[]} Array of Reminder data
 */
const generateReminders = (num: number = DEFAULT_NUM_REMINDERS): IReminder[] => {
  const reminders: IReminder[] = []

  for (let x = 0; x < num; x++) {
    const r: IReminder = reminderData()

    reminders.push(r)
  }

  return validate(reminders)
}

export { generateDescription, generateEvent, generateReminder, generateReminders, generateUser }
