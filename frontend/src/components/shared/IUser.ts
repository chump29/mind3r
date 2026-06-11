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

type vUserSchema = typeof vUserSchema

/**
 * Interface for vUserSchema
 * @interface IUser
 * @see {@link vUserSchema}
 */
type IUser = InferInput<vUserSchema>

export { type IUser, vUserSchema }
