import { useEffect, useLayoutEffect, useRef } from 'react'
import { useLocation, useNavigationType } from 'react-router'

// Scroll position per history entry (location.key), so Back/Forward return to
// where the player was — e.g. halfway down a league's match list (UAT 05-01).
const positions = new Map<string, number>()
// How long to keep trying while the page grows back to its old height
// (lists render from the query cache, but images/sections can lag a frame).
const RESTORE_TIMEOUT_MS = 1500

const ScrollToTop = () => {
  const { pathname, key } = useLocation()
  const navigationType = useNavigationType()
  const lastPathname = useRef(pathname)

  // We restore positions ourselves; the browser's own attempt fires before
  // the page has re-rendered and lands in the wrong place.
  useEffect(() => {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual'
    }
  }, [])

  // Remember where this entry is scrolled to, as the player scrolls.
  useEffect(() => {
    let frame = 0
    const save = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => positions.set(key, window.scrollY))
    }
    window.addEventListener('scroll', save, { passive: true })
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('scroll', save)
    }
  }, [key])

  useLayoutEffect(() => {
    const pathChanged = lastPathname.current !== pathname
    lastPathname.current = pathname
    const saved = positions.get(key)

    // Back/Forward to an entry we've seen: put the player back where they were.
    if (navigationType === 'POP' && saved != null) {
      const started = performance.now()
      let frame = 0
      // The player scrolling themselves wins over the restore.
      const stop = () => cancelAnimationFrame(frame)
      const restore = () => {
        window.scrollTo({ top: saved, left: 0, behavior: 'auto' })
        const reached = Math.abs(window.scrollY - saved) < 2
        if (!reached && performance.now() - started < RESTORE_TIMEOUT_MS) {
          frame = requestAnimationFrame(restore)
        }
      }
      restore()
      window.addEventListener('wheel', stop, { passive: true, once: true })
      window.addEventListener('touchstart', stop, { passive: true, once: true })
      return () => {
        stop()
        window.removeEventListener('wheel', stop)
        window.removeEventListener('touchstart', stop)
      }
    }

    // A new page starts at the top; a query change on the same page (a filter,
    // a league pick) keeps the scroll where it is.
    if (pathChanged) window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
  }, [pathname, key, navigationType])

  return null
}

export default ScrollToTop
