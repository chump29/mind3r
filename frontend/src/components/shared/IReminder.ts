import { type InferInput, object } from "valibot"

import { DateTimeSchema, DescriptionSchema, EventSchema, IdSchema, UserSchema } from "./schemas.ts"

/**
 * Validate an {@link IReminder} object
 * @property {Date} date
 * @see {@link DateTimeSchema}
 * @property {string} [description]
 * @see {@link DescriptionSchema}
 * @property {string} event
 * @see {@link EventSchema}
 * @property {number} [id]
 * @see {@link IdSchema}
 * @property {string} [user]
 * @see {@link UserSchema}
 */
const ReminderSchema = object({
  date: DateTimeSchema,
  description: DescriptionSchema,
  event: EventSchema,
  id: IdSchema,
  user: UserSchema
})

/**
 * Interface for ReminderSchema
 * @interface IReminder
 * @see {@link ReminderSchema}
 */
type IReminder = InferInput<typeof ReminderSchema>

export { type IReminder, ReminderSchema }
