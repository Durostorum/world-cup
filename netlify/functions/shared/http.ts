import type { Context } from '@netlify/functions'
import { z } from 'zod'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
}

export function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders },
  })
}

export function error(message: string, status = 400) {
  return json({ error: message }, status)
}

export function handleOptions(req: Request) {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders })
  }
  return null
}

/** Demo auth: use X-User-Id header. Production uses Netlify Identity JWT. */
export function getUserId(req: Request): string {
  return req.headers.get('X-User-Id') ?? 'u-demo'
}

export function parseBody<T>(schema: z.ZodSchema<T>, body: unknown) {
  const result = schema.safeParse(body)
  if (!result.success) {
    return { ok: false as const, error: result.error.errors[0]?.message ?? 'Invalid input' }
  }
  return { ok: true as const, data: result.data }
}

export type Handler = (req: Request, context: Context) => Promise<Response> | Response
