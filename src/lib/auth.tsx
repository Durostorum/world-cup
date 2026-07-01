import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

import {

  getUser,

  handleAuthCallback,

  hydrateSession,

  login,

  logout,

  onAuthChange,

  signup,

  type User,

} from '@netlify/identity'

import { bootstrapAppUser } from './bootstrap-user'
import type { EarlyAuthResult } from './auth-callback'
import { syncDevAuthCookie } from './identity-token'



interface SignupResult {

  needsEmailConfirmation: boolean

}



interface AuthContextValue {

  user: User | null

  loading: boolean

  authNotice: string | null

  clearAuthNotice: () => void

  login: (email: string, password: string) => Promise<void>

  signup: (email: string, password: string, displayName?: string) => Promise<SignupResult>

  logout: () => Promise<void>

}



const AuthContext = createContext<AuthContextValue | null>(null)



function isConfirmed(user: User) {

  return Boolean(user.confirmedAt)

}



export function AuthProvider({
  children,
  earlyAuth,
}: {
  children: React.ReactNode
  earlyAuth?: EarlyAuthResult
}) {

  const [user, setUser] = useState<User | null>(null)

  const [loading, setLoading] = useState(true)

  const [authNotice, setAuthNotice] = useState<string | null>(() => {
    if (earlyAuth?.status === 'confirmed' || earlyAuth?.status === 'error') {
      return earlyAuth.notice
    }
    return null
  })



  useEffect(() => {

    let active = true



    async function bootstrap() {

      try {

        const hashHasToken =
          typeof window !== 'undefined' && window.location.hash.includes('token')

        const callback = hashHasToken ? await handleAuthCallback() : null

        await hydrateSession()

        await syncDevAuthCookie()

        const current = await getUser()



        if (!active) return



        if (callback?.type === 'confirmation' && callback.user) {

          setUser(callback.user)

          setAuthNotice('Email confirmed — you are signed in.')

          void bootstrapAppUser().catch(() => undefined)

          return

        }



        if (earlyAuth?.status === 'confirmed' && current && isConfirmed(current)) {

          setUser(current)

          void bootstrapAppUser().catch(() => undefined)

          return

        }



        if (current && isConfirmed(current)) {

          setUser(current)

          void bootstrapAppUser().catch(() => undefined)

        } else if (import.meta.env.VITE_ENABLE_DEMO_AUTH === 'true') {

          const demoId = import.meta.env.VITE_DEMO_USER_ID as string | undefined

          if (demoId) {

            setUser({

              id: demoId,

              email: 'demo@local.dev',

              userMetadata: { full_name: 'Local Demo' },

            } as User)

          }

        } else {

          setUser(null)

        }

      } catch (err) {
        if (!active) return
        const message =
          err instanceof Error ? err.message : 'Authentication initialization failed.'
        if (window.location.hash.includes('confirmation_token')) {
          setAuthNotice(message)
        }
      } finally {

        if (active) setLoading(false)

      }

    }



    bootstrap()

    const unsubscribe = onAuthChange((event, sessionUser) => {

      if (event === 'login' || event === 'token_refresh' || event === 'user_updated') {

        if (sessionUser && isConfirmed(sessionUser)) {

          setUser(sessionUser)

          void syncDevAuthCookie()

          if (event === 'login') {

            void bootstrapAppUser().catch(() => undefined)

          }

        }

      }

      if (event === 'logout') setUser(null)

    })



    return () => {

      active = false

      unsubscribe()

    }

  }, [earlyAuth])



  const signIn = useCallback(async (email: string, password: string) => {

    const sessionUser = await login(email, password)

    if (!isConfirmed(sessionUser)) {

      throw new Error('Confirm your email before signing in. Check your inbox for the verification link.')

    }

    await syncDevAuthCookie()

    setUser(sessionUser)

    await bootstrapAppUser()

  }, [])



  const signUp = useCallback(async (email: string, password: string, displayName?: string) => {

    const sessionUser = await signup(email, password, displayName ? { full_name: displayName } : undefined)

    if (!isConfirmed(sessionUser)) {

      setUser(null)

      return { needsEmailConfirmation: true }

    }

    await syncDevAuthCookie()

    setUser(sessionUser)

    await bootstrapAppUser()

    return { needsEmailConfirmation: false }

  }, [])



  const signOut = useCallback(async () => {

    await logout()

    setUser(null)

    setAuthNotice(null)

  }, [])



  const clearAuthNotice = useCallback(() => setAuthNotice(null), [])



  const value = useMemo(

    () => ({

      user,

      loading,

      authNotice,

      clearAuthNotice,

      login: signIn,

      signup: signUp,

      logout: signOut,

    }),

    [user, loading, authNotice, clearAuthNotice, signIn, signUp, signOut],

  )



  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>

}



export function useAuth() {

  const ctx = useContext(AuthContext)

  if (!ctx) throw new Error('useAuth must be used within AuthProvider')

  return ctx

}

