import ModalComponent, { type ModalProps } from '../globals/ModalComponent'
import { Button } from '../globals/Button'
import { useState } from 'react'

export const COOKIE_CONSENT_KEY = 'cookieConsent'

const CookieConsent = ({ open, handleClose }: ModalProps) => {
  const [ageConfirmed, setAgeConfirmed] = useState(true)
  const [preferences, setPreferences] = useState({
    necessary: true,
    preferences: false,
    analytics: false,
  })

  const savePreferences = (prefs: typeof preferences) => {
    localStorage.setItem(
      COOKIE_CONSENT_KEY,
      JSON.stringify({
        ...prefs,
        ageConfirmed,
        consentedAt: new Date().toISOString(),
      }),
    )
  }

  const handleAcceptAll = () => {
    const allAccepted = {
      necessary: true,
      preferences: true,
      analytics: true,
    }
    setPreferences(allAccepted)
    savePreferences(allAccepted)
    handleClose()
  }

  const handleNecessaryOnly = () => {
    const necessaryOnly = {
      necessary: true,
      preferences: false,
      analytics: false,
    }
    setPreferences(necessaryOnly)
    savePreferences(necessaryOnly)
    handleClose()
  }

  return (
    <ModalComponent
      open={open}
      handleClose={handleClose}
      title='WELCOME TO SANTIBET'
      className='max-w-md! w-[90%]!'
      showCloseIcon={false}
      closeOnOverlayClick={false}
    >
      <div className='flex flex-col gap-4'>
        <p className='text-lg font-semibold text-black'>
          Before you predict, a couple of quick things
        </p>

        <p className='text-sm text-neutral-10'>
          We use cookies to keep you logged in, remember your preferences, and
          understand how SantiBet is used. See our
          <a
            href='/cookie-policy'
            target='_blank'
            rel='noopener noreferrer'
            className='text-black underline'
          >
            {' '}
            Cookie Policy
          </a>{' '}
          for details.
        </p>

        <div className='flex items-center gap-2 border border-border rounded-lg p-3'>
          <input
            type='checkbox'
            id='ageConfirm'
            checked={ageConfirmed}
            onChange={(e) => setAgeConfirmed(e.target.checked)}
            className='w-4 h-4 border-border accent-brand-green'
          />
          <label
            htmlFor='ageConfirm'
            className='text-sm font-medium text-black'
          >
            I confirm I am 18 years of age or older
          </label>
        </div>

        <div className='flex flex-col gap-2'>
          <Button
            type='button'
            text='Accept and continue'
            variation='primary'
            size='large'
            className='w-full'
            disabled={!ageConfirmed}
            onClick={handleAcceptAll}
          />

          <Button
            type='button'
            text='Necessary cookies only'
            variation='plain'
            size='large'
            className='w-full'
            disabled={!ageConfirmed}
            onClick={handleNecessaryOnly}
          />
        </div>

        <p className='text-xs text-center text-neutral-10'>
          SantiBet is operated by AWA LAWA LIMITED, Nigeria.
          <br />
          By continuing, you agree to our{' '}
          <a
            href='/terms-of-service'
            target='_blank'
            rel='noopener noreferrer'
            className='text-black font-medium underline'
          >
            Terms
          </a>{' '}
          and{' '}
          <a
            href='/privacy-policy'
            target='_blank'
            rel='noopener noreferrer'
            className='text-black font-medium underline'
          >
            Privacy Policy
          </a>
          .
        </p>
      </div>
    </ModalComponent>
  )
}

export default CookieConsent
