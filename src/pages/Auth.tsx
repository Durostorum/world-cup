import { FormEvent, useState } from 'react'

import { Navigate, useLocation } from 'react-router-dom'

import { AuthError, oauthLogin } from '@netlify/identity'

import { useAuth } from '../lib/auth'



export function AuthPage() {

  const { user, loading, login, signup, authNotice, clearAuthNotice } = useAuth()

  const location = useLocation()

  const [mode, setMode] = useState<'login' | 'signup'>('login')

  const [email, setEmail] = useState('')

  const [password, setPassword] = useState('')

  const [displayName, setDisplayName] = useState('')

  const [error, setError] = useState('')

  const [info, setInfo] = useState('')

  const [submitting, setSubmitting] = useState(false)



  const redirectTo = (location.state as { from?: string } | null)?.from ?? '/'



  if (!loading && user) {

    return <Navigate to={redirectTo} replace />

  }



  async function onSubmit(e: FormEvent) {

    e.preventDefault()

    setError('')

    setInfo('')

    clearAuthNotice()

    setSubmitting(true)

    try {

      if (mode === 'login') {

        await login(email, password)

      } else {

        const result = await signup(email, password, displayName || undefined)

        if (result.needsEmailConfirmation) {

          setInfo(
            'Account created. Check your email and click the confirmation link — you will be signed in automatically.',
          )

          setMode('login')

        }

      }

    } catch (err) {

      if (err instanceof AuthError && err.status === 401) {

        setError('Invalid email or password. If you just signed up, confirm your email first.')

      } else {

        setError(err instanceof Error ? err.message : 'Authentication failed')

      }

    } finally {

      setSubmitting(false)

    }

  }



  return (

    <div className="mx-auto max-w-md rounded-2xl bg-white p-8 shadow-xl">

      <h1 className="mb-2 text-2xl font-bold text-pitch">

        {mode === 'login' ? 'Sign in' : 'Create account'}

      </h1>

      <p className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-relaxed text-amber-950">
        This is a free social prediction game using fictional coins only. Coins have no cash value
        and cannot be purchased, sold, withdrawn, or exchanged for money, goods, or services.
      </p>
      <p className="mb-6 text-sm text-gray-500">

        Fictional coin pool — after email confirmation you receive 10,000 starter coins.

      </p>

      {(authNotice || info) && (

        <p className="mb-4 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-900">

          {authNotice ?? info}

        </p>

      )}

      <form onSubmit={onSubmit} className="space-y-4">

        {mode === 'signup' && (

          <label className="block text-sm">

            Display name

            <input

              type="text"

              value={displayName}

              onChange={(e) => setDisplayName(e.target.value)}

              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2"

              autoComplete="name"

            />

          </label>

        )}

        <label className="block text-sm">

          Email

          <input

            type="email"

            required

            value={email}

            onChange={(e) => setEmail(e.target.value)}

            className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2"

            autoComplete="email"

          />

        </label>

        <label className="block text-sm">

          Password

          <input

            type="password"

            required

            minLength={8}

            value={password}

            onChange={(e) => setPassword(e.target.value)}

            className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2"

            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}

          />

        </label>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button

          type="submit"

          disabled={submitting}

          className="w-full rounded-lg bg-pitch py-3 font-semibold text-white disabled:opacity-60"

        >

          {submitting ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Sign up'}

        </button>

      </form>

      <div className="my-4 flex items-center gap-3 text-xs text-gray-400">
        <span className="h-px flex-1 bg-gray-200" />
        or
        <span className="h-px flex-1 bg-gray-200" />
      </div>

      <button
        type="button"
        onClick={() => oauthLogin('google')}
        className="w-full rounded-lg border border-gray-200 py-3 text-sm font-semibold text-pitch hover:bg-gray-50"
      >
        Continue with Google
      </button>

      <button

        type="button"

        className="mt-4 w-full text-sm text-pitch underline"

        onClick={() => {

          setMode(mode === 'login' ? 'signup' : 'login')

          setError('')

          setInfo('')

          clearAuthNotice()

        }}

      >

        {mode === 'login' ? 'Need an account? Sign up' : 'Already have an account? Sign in'}

      </button>

    </div>

  )

}

