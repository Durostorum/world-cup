import { api } from './api'
import { syncDevAuthCookie } from './identity-token'

/** Creates the app DB user (10k coins) on first authenticated API call. */
export async function bootstrapAppUser() {
  await syncDevAuthCookie()
  return api.getProfile()
}
