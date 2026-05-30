import { type InferInput, object } from "valibot"

import { DateTimeSchema, DescriptionSchema, EventSchema, IdSchema } from "./schemas.ts"

/**
 * Validates an {@link IReminder} object
 * @property {Date} date
 * @see {@link DateTimeSchema}
 * @property {string} [description]
 * @see {@link DescriptionSchema}
 * @property {string} event
 * @see {@link EventSchema}
 * @property {number} [id]
 * @see {@link IdSchema}
 */
const ReminderSchema = object({
  date: DateTimeSchema,
  description: DescriptionSchema,
  event: EventSchema,
  id: IdSchema
})

/**
 * Interface for ReminderSchema
 * @interface IReminder
 * @see {@link ReminderSchema}
 */
type IReminder = InferInput<typeof ReminderSchema>

export { type IReminder, ReminderSchema }
