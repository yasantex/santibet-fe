import type { ReactNode } from 'react'
import { Button } from './Button'

type StepperProps = {
  steps: number
  current: number
  className?: string
}

// Segmented progress bar — one segment per step, filled up to `current`.
export const Stepper = ({ steps, current, className = '' }: StepperProps) => (
  <div className={`flex w-full gap-1.5 ${className}`}>
    {Array.from({ length: steps }, (_, i) => (
      <span
        key={i}
        className={`h-1 flex-1 rounded-full transition-colors ${
          i <= current ? 'bg-brand-green' : 'bg-hover'
        }`}
      />
    ))}
  </div>
)

type StepScreenProps = {
  title: string
  subtitle?: ReactNode
  children: ReactNode
  continueText?: string
  continueDisabled?: boolean
  loading?: boolean
  onContinue: () => void
  // Secondary action under Continue — "Back" on later steps, "Not now" on the first.
  secondaryText?: string
  onSecondary?: () => void
  footer?: ReactNode
}

// One screen of a stepped flow: heading, fields, Continue + secondary action.
export const StepScreen = ({
  title,
  subtitle,
  children,
  continueText = 'Continue',
  continueDisabled,
  loading,
  onContinue,
  secondaryText,
  onSecondary,
  footer,
}: StepScreenProps) => (
  <form
    className='flex w-full flex-col gap-3'
    onSubmit={(e) => {
      e.preventDefault()
      if (!continueDisabled && !loading) onContinue()
    }}
  >
    <div className='flex flex-col gap-1.5'>
      <h3 className='text-base font-bold text-black'>{title}</h3>
      {subtitle && <p className='text-sm text-neutral-10'>{subtitle}</p>}
    </div>

    <div className='flex flex-col gap-2.5'>{children}</div>

    <Button
      type='submit'
      text={continueText}
      variation='primary'
      className='mt-4'
      size='large'
      loading={loading}
      disabled={continueDisabled || loading}
    />
    {secondaryText && onSecondary && (
      <Button
        type='button'
        text={secondaryText}
        variation='plain'
        size='large'
        disabled={loading}
        onClick={onSecondary}
      />
    )}
    {footer}
  </form>
)
