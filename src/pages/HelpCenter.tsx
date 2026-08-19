import { useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  ArrowDown01Icon,
  Mail01Icon,
  WhatsappIcon,
} from '@hugeicons/core-free-icons'
import { Link } from 'react-router'

const faqs = [
  {
    q: 'What is a prediction market?',
    a: 'A prediction market lets you trade on the outcome of real-world events. Each market has outcomes (for example YES and NO) priced between ₦1 and ₦99. The price reflects the market’s estimated probability of that outcome.',
  },
  {
    q: 'How do I place a prediction?',
    a: 'Open a market, choose an outcome, enter an amount, and place your prediction. Your potential return is shown before you confirm. If your outcome wins, each share settles at ₦100.',
  },
  {
    q: 'How do deposits work?',
    a: 'Go to your Wallet and tap “Deposit”. Transfer the exact amount to the account shown, then confirm. Funds are credited to your trading balance once received.',
  },
  {
    q: 'How do I withdraw my winnings?',
    a: 'Add a withdrawal account in your Wallet, move winnings to your trading balance if needed, then request a payout. Withdrawals are reviewed before being dispatched.',
  },
  {
    q: 'Can I exit a position early?',
    a: 'Yes. Open positions can be cashed out from your Portfolio at their current value, before the market resolves.',
  },
  {
    q: 'How are markets resolved?',
    a: 'Each market lists its resolution rules and source. Once the event concludes, the market resolves to the winning outcome and payouts are settled automatically.',
  },
]

const HelpCenter = () => {
  const [open, setOpen] = useState<number | null>(0)

  return (
    <main className='mx-auto flex w-full max-w-3xl flex-col gap-6 px-3 pt-4 pb-20 md:px-8'>
      <div className='flex flex-col gap-2'>
        <h1 className='text-[18px] font-bold text-black md:text-[28px]'>
          Help Center
        </h1>
        <p className='text-sm text-neutral-10'>
          Answers to common questions about trading on SantiBet.
        </p>
      </div>

      <div className='flex flex-col gap-3'>
        {faqs.map((faq, i) => {
          const isOpen = open === i
          return (
            <div
              key={faq.q}
              className='overflow-hidden rounded-2xl border border-border bg-card'
            >
              <button
                type='button'
                onClick={() => setOpen(isOpen ? null : i)}
                className='flex w-full items-center justify-between gap-4 px-4 py-4 text-left'
              >
                <span className='text-sm font-semibold text-black'>
                  {faq.q}
                </span>
                <HugeiconsIcon
                  icon={ArrowDown01Icon}
                  size={18}
                  className={`shrink-0 text-neutral-10 transition-transform ${
                    isOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>
              {isOpen && (
                <p className='px-4 pb-4 text-sm leading-relaxed text-neutral-10'>
                  {faq.a}
                </p>
              )}
            </div>
          )
        })}
      </div>

      <section className='flex flex-col gap-3 rounded-2xl border border-border bg-card p-5'>
        <h2 className='text-sm font-semibold text-black uppercase'>
          Still need help?
        </h2>
        <div className='flex flex-col gap-3 sm:flex-row'>
          <a
            href='mailto:support@santibet.com'
            className='flex flex-1 items-center gap-3 rounded-lg border border-border px-4 py-3 hover:bg-hover'
          >
            <HugeiconsIcon icon={Mail01Icon} size={20} className='text-black' />
            <div className='flex flex-col'>
              <span className='text-sm font-semibold text-black'>Email us</span>
              <span className='text-xs text-neutral-10'>
                support@santibet.com
              </span>
            </div>
          </a>
          <a
            href='https://wa.me/'
            target='_blank'
            rel='noreferrer'
            className='flex flex-1 items-center gap-3 rounded-lg border border-border px-4 py-3 hover:bg-hover'
          >
            <HugeiconsIcon
              icon={WhatsappIcon}
              size={20}
              className='text-black'
            />
            <div className='flex flex-col'>
              <span className='text-sm font-semibold text-black'>WhatsApp</span>
              <span className='text-xs text-neutral-10'>Chat with support</span>
            </div>
          </a>
        </div>
        <p className='text-xs text-neutral-10'>
          You can also review our{' '}
          <Link to='/terms-of-service' className='font-semibold text-black underline'>
            Terms of Service
          </Link>{' '}
          and{' '}
          <Link to='/privacy-policy' className='font-semibold text-black underline'>
            Privacy Policy
          </Link>
          .
        </p>
      </section>
    </main>
  )
}

export default HelpCenter
