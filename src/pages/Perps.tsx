import { HugeiconsIcon } from '@hugeicons/react'
import { Clock01Icon } from '@hugeicons/core-free-icons'
import { useNavigate } from 'react-router'
import { Button } from '../components/globals/Button'

const Perps = () => {
  const navigate = useNavigate()
  return (
    <main className='mx-auto flex w-full max-w-lg flex-col items-center gap-4 px-5 py-24 text-center'>
      <div className='flex h-14 w-14 items-center justify-center rounded-full bg-card text-neutral-10'>
        <HugeiconsIcon icon={Clock01Icon} size={28} />
      </div>
      <h1 className='text-2xl font-bold text-black'>Perps are coming soon</h1>
      <p className='text-sm text-neutral-10'>
        Leveraged, funding-rate perpetual futures alongside our prediction
        markets — we're building it now.
      </p>
      <Button
        type='button'
        text='Back to markets'
        variation='primary'
        size='large'
        onClick={() => navigate('/')}
      />
    </main>
  )
}

export default Perps
