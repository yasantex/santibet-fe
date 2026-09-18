import { HugeiconsIcon } from '@hugeicons/react'
import { SadDizzyIcon } from '@hugeicons/core-free-icons'
import { useNavigate } from 'react-router'
import { Button } from '../components/globals/Button'

interface ErrorPageProps {
  code?: string
  title?: string
  message?: string
  onRetry?: () => void
}

const ErrorPage = ({
  code = '404',
  title = 'Page not found',
  message = "The page you're looking for doesn't exist or may have been moved.",
  onRetry,
}: ErrorPageProps) => {
  const navigate = useNavigate()

  return (
    <main className='mx-auto flex w-full max-w-md flex-col items-center gap-5 px-5 py-24 text-center'>
      <div className='flex h-16 w-16 items-center justify-center rounded-full bg-error-bg text-error'>
        <HugeiconsIcon icon={SadDizzyIcon} size={32} />
      </div>

      <div className='flex flex-col gap-1.5'>
        <p className='text-xs font-semibold tracking-wide text-neutral-10 uppercase'>
          Error {code}
        </p>
        <h1 className='text-xl font-bold text-black'>{title}</h1>
        <p className='text-sm text-neutral-10'>{message}</p>
      </div>

      <div className='flex w-full items-center gap-3'>
        {onRetry && (
          <Button
            type='button'
            text='Try again'
            variation='plain'
            size='large'
            className='w-full'
            onClick={onRetry}
          />
        )}
        <Button
          type='button'
          text='Back to markets'
          variation='primary'
          size='large'
          className='w-full'
          onClick={() => navigate('/')}
        />
      </div>
    </main>
  )
}

export default ErrorPage
