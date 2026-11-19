import { useEffect, useState } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router'
import { useCookies } from 'react-cookie'
import { useAppSelector } from '../utils/hooks'
import { restoreSession, type RestoreResult } from '../data_layer/utils'
import { buildAuthPath } from '../utils/authRedirect'
import { Button } from '../components/globals/Button'

const Spinner = () => (
  <div className='flex min-h-[60vh] w-full items-center justify-center'>
    <span className='h-8 w-8 animate-spin rounded-full border-2 border-brand-green border-t-transparent' />
  </div>
)

const ProtectedRoute = () => {
  const [cookies] = useCookies(['token'])
  const { user } = useAppSelector((state) => state.user)
  const { pathname, search, hash } = useLocation()
  const hasToken = Boolean(cookies?.token)

  // A saved user whose token cookie has gone (expired, or cleared by the
  // browser): get a new token before deciding, instead of bouncing home —
  // which on mobile looked like the page refreshing (Testing Round 1, #1).
  const needsRestore = !!user && !hasToken
  const [result, setResult] = useState<RestoreResult | 'pending' | null>(null)
  const [attempt, setAttempt] = useState(0)

  // Start a restore the render it becomes needed (not in the effect), so a
  // refused restore — which clears the user — is never mistaken for a guest.
  const [prevNeedsRestore, setPrevNeedsRestore] = useState(false)
  if (needsRestore !== prevNeedsRestore) {
    setPrevNeedsRestore(needsRestore)
    if (needsRestore) setResult('pending')
  }

  // Not cancelled on cleanup: a refused restore clears the user (which flips
  // needsRestore), and its result is still what decides where to go.
  // Concurrent calls share one refresh request.
  useEffect(() => {
    if (!needsRestore) return
    void restoreSession().then(setResult)
  }, [needsRestore, attempt])

  if (hasToken && user) return <Outlet />

  // Signed out by a refused restore: sign in, then come back here.
  if (result === 'signed-out') {
    return (
      <Navigate
        to={buildAuthPath('/signin', `${pathname}${search}${hash}`)}
        replace
      />
    )
  }

  if (result === 'pending') return <Spinner />

  if (user && result === 'unreachable') {
    return (
      <div className='flex min-h-[60vh] w-full flex-col items-center justify-center gap-3 px-5 text-center'>
        <p className='text-sm text-neutral-10'>
          We couldn’t reach SantiBet. Check your connection and try again.
        </p>
        <Button
          type='button'
          text='Try again'
          variation='plain'
          className='w-fit!'
          onClick={() => {
            setResult('pending')
            setAttempt((n) => n + 1)
          }}
        />
      </div>
    )
  }

  // Never signed in (or signed out elsewhere): same as before.
  if (!user) return <Navigate to='/' replace />

  return <Spinner />
}

export default ProtectedRoute
