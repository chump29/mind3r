import { SignJWT } from "jose/jwt/sign"

const getJWT = async (user: string): Promise<string> =>
  await new SignJWT()
    .setProtectedHeader({
      alg: "HS256",
      typ: "JWT"
    })
    .setExpirationTime("15m")
    .setIssuedAt()
    .setSubject(user)
    .sign(new TextEncoder().encode(Bun.env.TOKEN))

/**
 * Get request headers
 * @async
 * @function
 * @summary Includes JWT
 * @param {string} user User
 * @returns {HeadersInit} Request headers
 */
const getHeaders = async (user: string | undefined): Promise<HeadersInit | undefined> => {
  if (!user || user.length === 0) {
    return
  }

  return {
    Authorization: `Bearer ${await getJWT(user)}`,
    "Content-Type": "application/json"
  } satisfies HeadersInit
}

export { getHeaders }
