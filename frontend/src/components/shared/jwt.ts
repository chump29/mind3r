import { UnsecuredJWT } from "jose"

const getJWT = (user: string): string =>
  new UnsecuredJWT().setExpirationTime("30s").setIssuedAt().setSubject(user).encode()

/**
 * Get request headers
 * @function
 * @summary Includes unsecured JWT
 * @param {string} user User
 * @returns {HeadersInit} Request headers
 */
const getHeaders = (user: string | undefined): HeadersInit | undefined => {
  if (!user || user.length === 0) {
    return
  }

  return {
    Authorization: `Bearer ${getJWT(user)}`,
    "Content-Type": "application/json"
  } satisfies HeadersInit
}

export { getHeaders }
