import { useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { ArrowRight01Icon, LockIcon } from '@hugeicons/core-free-icons'
import type { KycStatusResponse } from '../../../types/types'
import { kycStatusBadge } from '../../../utils/status'
import StandardVerification from '../../../components/appModals/StandardVerification'

type KycTabProps = {
  kycStatus: KycStatusResponse | undefined
  kycLoading: boolean
  refetchKyc: () => void
}

const KycTab = ({ kycStatus, kycLoading, refetchKyc }: KycTabProps) => {
  const [kycModalOpen, setKycModalOpen] = useState(false)
  const badge = kycStatusBadge(kycStatus?.status)

  return (
    <div className='flex flex-col gap-5'>
      <section className='flex flex-col gap-2.5'>
        <div>
          <h2 className='text-sm font-semibold text-black'>
            Verification levels
          </h2>
          <p className='text-xs text-placeholder'>
            Complete verification to unlock higher deposit and withdrawal
            limits.
          </p>
        </div>

        <div className='flex flex-col gap-3'>
          {/* Basic — verified automatically on sign up */}
          <div className='flex flex-col gap-3 rounded-2xl border border-border bg-card p-4'>
            <div className='flex items-center justify-between'>
              <div className='flex items-center gap-2'>
                <span className='h-2 w-2 rounded-full bg-neutral-10' />
                <span className='text-sm font-semibold text-black'>Basic</span>
              </div>
              <span className='w-fit rounded-full bg-surface-success px-2.5 py-0.5 text-xs font-semibold text-success'>
                Auto-verified
              </span>
            </div>
            <p className='text-xs text-placeholder'>
              Email or phone — confirmed automatically when you sign up.
            </p>
            <div className='grid grid-cols-2 gap-3 rounded-lg p-3'>
              <div>
                <p className='text-[11px] text-placeholder'>Deposit</p>
                <p className='text-sm font-medium text-black'>No minimum</p>
              </div>
              <div>
                <p className='text-[11px] text-placeholder'>Max withdrawal</p>
                <p className='text-sm font-medium text-black'>500,000</p>
              </div>
            </div>
          </div>

          {/* Standard — government ID verification */}
          <button
            type='button'
            onClick={() => setKycModalOpen(true)}
            className='flex flex-col gap-3 rounded-2xl cursor-pointer border border-border bg-card p-4 text-left transition-colors hover:bg-hover'
          >
            <div className='flex items-center justify-between gap-2'>
              <div className='flex items-center gap-2'>
                <span className='h-2 w-2 rounded-full bg-brand-green' />
                <span className='text-sm font-semibold text-black'>
                  Standard
                </span>
              </div>
              <div className='flex items-center gap-2'>
                {kycLoading ? (
                  <span className='h-5 w-16 animate-pulse rounded-full bg-neutral-10/20' />
                ) : (
                  <span
                    className={`w-fit rounded-full px-2.5 py-0.5 text-xs font-semibold ${badge.className}`}
                  >
                    {badge.label}
                  </span>
                )}
                <HugeiconsIcon
                  icon={ArrowRight01Icon}
                  size={18}
                  className='shrink-0 text-neutral-10'
                />
              </div>
            </div>
            <p className='text-xs text-placeholder'>
              Government ID, full name and date of birth.
            </p>
            <div className='grid grid-cols-2 gap-3 rounded-lg p-3'>
              <div>
                <p className='text-[11px] text-placeholder'>Deposit</p>
                <p className='text-sm font-medium text-black'>No minimum</p>
              </div>
              <div>
                <p className='text-[11px] text-placeholder'>Max withdrawal</p>
                <p className='text-sm font-medium text-black'>-</p>
              </div>
            </div>
          </button>

          {/* Advanced — not implemented yet */}
          <div className='flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 opacity-60'>
            <div className='flex items-center justify-between'>
              <div className='flex items-center gap-2'>
                <span className='h-2 w-2 rounded-full bg-warning' />
                <span className='text-sm font-semibold text-black'>
                  Advanced
                </span>
              </div>
              <div className='flex items-center gap-1.5 text-xs font-semibold text-placeholder'>
                <HugeiconsIcon icon={LockIcon} size={14} />
                Coming soon
              </div>
            </div>
            <p className='text-xs text-placeholder'>
              Bank statement or payslip.
            </p>
            <div className='grid grid-cols-2 gap-3 rounded-lg p-3'>
              <div>
                <p className='text-[11px] text-placeholder'>Deposit</p>
                <p className='text-sm font-medium text-black'>No minimum</p>
              </div>
              <div>
                <p className='text-[11px] text-placeholder'>Max withdrawal</p>
                <p className='text-sm font-medium text-black'>-</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <StandardVerification
        open={kycModalOpen}
        handleClose={() => setKycModalOpen(false)}
        kycStatus={kycStatus}
        kycLoading={kycLoading}
        refetchKyc={refetchKyc}
      />
    </div>
  )
}

export default KycTab
