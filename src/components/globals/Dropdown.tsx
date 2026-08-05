import { useEffect, useRef, useState, type ReactNode } from 'react'
import classNames from 'classnames'

type Align = 'start' | 'end'

type DropdownProps = {
  children: ReactNode
  align?: Align
  className?: string
  menuClassName?: string
  menu: ReactNode | ((args: { close: () => void }) => ReactNode)
  disabled?: boolean
}

export default function Dropdown({
  children,
  menu,
  align = 'start',
  className,
  menuClassName = 'w-full',
  disabled = false,
}: DropdownProps) {
  const [open, setOpen] = useState(false)
  const [opensUpward, setOpensUpward] = useState(false)
  const triggerRef = useRef<HTMLDivElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  const close = () => setOpen(false)

  const handleToggle = () => {
    if (!open && triggerRef.current) {
      const { bottom } = triggerRef.current.getBoundingClientRect()
      setOpensUpward(bottom > window.innerHeight * 0.6)
    }
    setOpen((v) => !v)
  }

  // Close on outside click
  useEffect(() => {
    if (!open) return

    const handler = (e: MouseEvent) => {
      if (
        !triggerRef.current?.contains(e.target as Node) &&
        !menuRef.current?.contains(e.target as Node)
      ) {
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  // Compute final alignment class
  const alignmentClass = classNames(
    align === 'start' ? 'left-0' : 'right-0',
    opensUpward ? 'bottom-full mb-2' : 'top-full mt-2'
  )

  if (disabled) return <>{children}</>

  return (
    <div className={classNames('relative z-30! w-fit inline-block', className)}>
      <div ref={triggerRef} onClick={handleToggle}>
        {children}
      </div>

      {open && (
        <div
          ref={menuRef}
          className={classNames(
            'absolute border-[0.5px] z-80 bg-white dark:bg-card border-border',
            alignmentClass,
            menuClassName
          )}
        >
          {typeof menu === 'function' ? menu({ close }) : menu}
        </div>
      )}
    </div>
  )
}
