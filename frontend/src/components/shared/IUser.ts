import { type InferInput, object } from "valibot"

import { UserSchema } from "./schemas.ts"

/**
 * Validate an {@link IUser} object
 * @property {string} user
 * @see {@link UserSchema}
 */
const vUserSchema = object({
  user: UserSchema
})

/**
 * Interface for vUserSchema
 * @interface IUser
 * @see {@link vUserSchema}
 */
type IUser = InferInput<typeof vUserSchema>

export { type IUser, vUserSchema }
