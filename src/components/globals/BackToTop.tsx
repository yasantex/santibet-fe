import { useEffect, useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { ArrowUp01Icon } from '@hugeicons/core-free-icons'
import { scrollToTop } from '../../utils/functions'

// Show the button once the user is roughly a screen and a half down the page.
const SHOW_AFTER_PX = 200

/**
 * Floating "back to top" arrow. Sits bottom-left so it never collides with
 * the bet-slip FAB on the right; clears the mobile bottom nav below `md`.
 */
const BackToTop = () => {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > SHOW_AFTER_PX)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <button
      type='button'
      aria-label='Back to top'
      onClick={scrollToTop}
      tabIndex={visible ? 0 : -1}
      className={`fixed right-4 cursor-pointer bottom-20 z-40 flex h-11 w-11 items-center justify-center rounded-full border border-border bg-white text-black shadow-lg transition-all duration-300 ease-out hover:-translate-y-0.5 hover:shadow-xl md:bottom-6 ${
        visible
          ? 'translate-y-0 opacity-100'
          : 'pointer-events-none translate-y-4 opacity-0'
      }`}
    >
      <HugeiconsIcon icon={ArrowUp01Icon} size={20} />
    </button>
  )
}

export default BackToTop
