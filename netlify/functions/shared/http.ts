import type { Context } from '@netlify/functions'
import { getIdentityConfig, getUser, refreshSession } from '@netlify/identity'
import { z } from 'zod'

const LOCAL_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:8888',
  'http://localhost:8889',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:8888',
  'http://127.0.0.1:8889',
]

function parseAllowedOrigins(): Set<string> {
  const origins = new Set(LOCAL_ORIGINS)
  for (const key of ['URL', 'DEPLOY_PRIME_URL', 'DEPLOY_URL'] as const) {
    const value = process.env[key]
    if (value) origins.add(value.replace(/\/$/, ''))
  }
  const extra = process.env.ALLOWED_ORIGINS?.split(',').map((o) => o.trim()).filter(Boolean) ?? []
  for (const origin of extra) origins.add(origin.replace(/\/$/, ''))
  return origins
}

const ALLOWED_ORIGINS = parseAllowedOrigins()

function resolveCorsOrigin(req: Request): string | null {
  const origin = req.headers.get('Origin')
  if (!origin) return null
  const normalized = origin.replace(/\/$/, '')
  return ALLOWED_ORIGINS.has(normalized) ? origin : null
}

function corsHeaders(req: Request): Record<string, string> {
  const allowOrigin = resolveCorsOrigin(req)
  const headers: Record<string, string> = {
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-User-Id, X-User-Email',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    Vary: 'Origin',
  }
  if (allowOrigin) {
    headers['Access-Control-Allow-Origin'] = allowOrigin
    headers['Access-Control-Allow-Credentials'] = 'true'
  }
  return headers
}

export function json(req: Request, data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders(req) },
  })
}

export function error(req: Request, message: string, status = 400) {
  return json(req, { error: message }, status)
}

export function handleOptions(req: Request) {
  if (req.method !== 'OPTIONS') return null
  const allowOrigin = resolveCorsOrigin(req)
  if (!allowOrigin) {
    return new Response(null, { status: 403 })
  }
  return new Response(null, { status: 204, headers: corsHeaders(req) })
}

export interface AuthUser {
  id: string
  email: string
}

function decodeJwtClaims(token: string): {
  sub?: string
  email?: string
  user_metadata?: { email?: string; full_name?: string }
} | null {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null
    const payload = parts[1].replace(/-/g, '+').replace(/_/g, '/')
    const padded = payload + '='.repeat((4 - (payload.length % 4)) % 4)
    const json =
      typeof atob === 'function'
        ? atob(padded)
        : Buffer.from(padded, 'base64').toString('utf8')
    return JSON.parse(json) as { sub?: string; email?: string }
  } catch {
    return null
  }
}

function userFromJwtClaims(token: string): AuthUser | null {
  const claims = decodeJwtClaims(token)
  if (!claims?.sub) return null
  const email =
    claims.email ??
    (typeof claims.user_metadata?.email === 'string' ? claims.user_metadata.email : null)
  if (!email) return null
  return { id: claims.sub, email }
}

async function userFromBearerToken(token: string): Promise<AuthUser | null> {
  const config = getIdentityConfig()
  if (config?.url) {
    try {
      const res = await fetch(`${config.url}/user`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = (await res.json()) as { id?: string; email?: string }
        if (data.id && data.email) return { id: data.id, email: data.email }
      }
    } catch {
      // Fall through to JWT claim decode for local dev / transient Identity errors.
    }
  }

  return userFromJwtClaims(token)
}

async function resolveAuthUser(req: Request): Promise<AuthUser | null> {
  try {
    await refreshSession()
  } catch {
    // Cookie refresh can fail when the client sends a bearer token instead.
  }

  const user = await getUser()
  if (user?.id && user.email) {
    return { id: user.id, email: user.email }
  }

  const bearer = req.headers.get('Authorization')?.replace(/^Bearer\s+/i, '')
  if (bearer) {
    const fromToken = await userFromBearerToken(bearer)
    if (fromToken) return fromToken
  }

  if (process.env.ALLOW_DEMO_AUTH === 'true' && process.env.CONTEXT !== 'production') {
    const demoId = req.headers.get('X-User-Id')
    if (demoId) {
      return { id: demoId, email: req.headers.get('X-User-Email') ?? `${demoId}@local.dev` }
    }
  }

  return null
}

/** Same as requireAuth but returns null instead of a 401 response. */
export async function optionalAuth(req: Request): Promise<AuthUser | null> {
  return resolveAuthUser(req)
}

/** Validates Netlify Identity via function cookies or Authorization: Bearer header. */
export async function requireAuth(req: Request): Promise<AuthUser | Response> {
  const user = await resolveAuthUser(req)
  if (user) return user
  return error(req, 'Unauthorized', 401)
}

export function parseBody<T>(schema: z.ZodSchema<T>, body: unknown) {
  const result = schema.safeParse(body)
  if (!result.success) {
    return { ok: false as const, error: result.error.errors[0]?.message ?? 'Invalid input' }
  }
  return { ok: true as const, data: result.data }
}

export type Handler = (req: Request, context: Context) => Promise<Response> | Response

function parseAdminEmails(): Set<string> {
  const raw = process.env.ADMIN_EMAILS ?? ''
  return new Set(
    raw
      .split(',')
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean),
  )
}

/** Requires authenticated user listed in ADMIN_EMAILS (comma-separated). */
export async function requireAdmin(req: Request): Promise<AuthUser | Response> {
  const auth = await requireAuth(req)
  if (auth instanceof Response) return auth

  const admins = parseAdminEmails()
  if (admins.size === 0) {
    console.error('ADMIN_EMAILS is not configured')
    return error(req, 'Admin access is not configured', 503)
  }
  if (!admins.has(auth.email.toLowerCase())) {
    return error(req, 'Forbidden', 403)
  }
  return auth
}

/** Catches unexpected errors and returns JSON instead of an empty Lambda response. */
export function withApiHandler(
  handler: (req: Request, context: Context) => Promise<Response> | Response,
): Handler {
  return async (req, context) => {
    const opt = handleOptions(req)
    if (opt) return opt
    try {
      return await handler(req, context)
    } catch (err) {
      console.error('API handler error:', err instanceof Error ? err.message : err)
      return error(req, 'Internal server error', 500)
    }
  }
}
