import { useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  Delete02Icon,
  CheckmarkCircle02Icon,
  AlertCircleIcon,
} from '@hugeicons/core-free-icons'
import { useSantiBetMutation, useSantiBetQuery } from '../../data_layer/utils'
import type {
  WithdrawalAccount,
  WithdrawalAccountsListResponse,
  CryptoWalletResponse,
  CrytpoAddress,
} from '../../types/wallet.types'
import { isAxiosError } from 'axios'
import { showWarningToast, showSuccessToast } from '../../utils/toastUtils'
import { useQueryClient } from '@tanstack/react-query'
import AddWithdrawalAccount from '../appModals/AddWithdrawalAccount'
import { useModalControl } from '../../hooks/useModalControl'
import type { BaseApiResponse } from '../../types/types'
import { Button } from '../globals/Button'

const AccountRow = ({ account }: { account: WithdrawalAccount }) => {
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const queryClient = useQueryClient()

  const { mutateAsync: removeAccount, isPending: isDeleting } =
    useSantiBetMutation<BaseApiResponse>({
      path: `/wallet/withdrawal-accounts/${account.id}`,
      method: 'DELETE',
      mutationOptions: {
        onSuccess: () => {
          queryClient.invalidateQueries({
            queryKey: ['withdrawal-accounts'],
          })
          showSuccessToast('Account removed')
        },
        onError: (error) => {
          if (isAxiosError(error)) {
            const errorData = error.response?.data
            showWarningToast(errorData?.message)
          } else {
            showWarningToast(error.message)
          }
        },
      },
    })

  const handleDeleteTap = async () => {
    if (!confirmingDelete) {
      setConfirmingDelete(true)
      return
    }
    try {
      await removeAccount({})
    } catch (error) {
      console.error(error)
    } finally {
      setConfirmingDelete(false)
    }
  }

  return (
    <div className='flex flex-col gap-3 rounded-lg border border-border p-3 sm:flex-row sm:items-center sm:justify-between'>
      <div className='flex items-start gap-2.5 min-w-0'>
        <HugeiconsIcon
          icon={account.verified ? CheckmarkCircle02Icon : AlertCircleIcon}
          size={18}
          className={`mt-0.5 shrink-0 ${
            account.verified ? 'text-success' : 'text-warning'
          }`}
        />
        <div className='flex flex-col min-w-0'>
          <span className='text-sm font-semibold text-black truncate'>
            {account.label}
          </span>
          <span className='text-xs text-neutral-10 truncate'>
            {account.accountName} · {account.accountNumber}
          </span>
          {!account.verified && (
            <span className='text-xs text-warning'>Verification pending</span>
          )}
        </div>
      </div>

      <div className='flex items-center gap-2'>
        <button
          type='button'
          onClick={handleDeleteTap}
          onBlur={() => setConfirmingDelete(false)}
          disabled={isDeleting}
          className={`flex items-center gap-1.5 rounded-full cursor-pointer px-3 py-1.5 text-xs font-semibold transition-colors disabled:opacity-50 ${
            confirmingDelete
              ? 'bg-error text-white'
              : 'border border-error text-error hover:bg-surface-error'
          }`}
        >
          <HugeiconsIcon icon={Delete02Icon} size={14} />
          {confirmingDelete ? 'Tap to confirm' : 'Remove'}
        </button>
      </div>
    </div>
  )
}

const CryptoAccountRow = ({ account }: { account: CrytpoAddress }) => {
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const queryClient = useQueryClient()

  const { mutateAsync: removeAccount, isPending: isDeleting } =
    useSantiBetMutation<BaseApiResponse>({
      path: `/wallet/crypto/accounts/${account.id}`,
      method: 'DELETE',
      mutationOptions: {
        onSuccess: () => {
          queryClient.invalidateQueries({
            queryKey: ['crypto-withdrawal-accounts'],
          })
          showSuccessToast('Address removed')
        },
        onError: (error) => {
          if (isAxiosError(error)) {
            const errorData = error.response?.data
            showWarningToast(errorData?.message)
          } else {
            showWarningToast(error.message)
          }
        },
      },
    })

  const handleDeleteTap = async () => {
    if (!confirmingDelete) {
      setConfirmingDelete(true)
      return
    }
    try {
      await removeAccount({})
    } catch (error) {
      console.error(error)
    } finally {
      setConfirmingDelete(false)
    }
  }

  return (
    <div className='flex flex-col gap-3 rounded-lg border border-border p-3 sm:flex-row sm:items-center sm:justify-between'>
      <div className='flex items-start gap-2.5 min-w-0'>
        <HugeiconsIcon
          icon={account.verified ? CheckmarkCircle02Icon : AlertCircleIcon}
          size={18}
          className={`mt-0.5 shrink-0 ${
            account.verified ? 'text-success' : 'text-warning'
          }`}
        />
        <div className='flex flex-col min-w-0'>
          <span className='text-sm font-semibold text-black truncate'>
            {account.label || `${account.currency} · ${account.network}`}
          </span>
          <span className='text-xs text-neutral-10 truncate'>
            {account.currency} ({account.network}) · {account.address}
          </span>
          {!account.verified && (
            <span className='text-xs text-warning'>Verification pending</span>
          )}
        </div>
      </div>

      <div className='flex items-center gap-2'>
        <button
          type='button'
          onClick={handleDeleteTap}
          onBlur={() => setConfirmingDelete(false)}
          disabled={isDeleting}
          className={`flex items-center gap-1.5 rounded-full cursor-pointer px-3 py-1.5 text-xs font-semibold transition-colors disabled:opacity-50 ${
            confirmingDelete
              ? 'bg-error text-white'
              : 'border border-error text-error hover:bg-surface-error'
          }`}
        >
          <HugeiconsIcon icon={Delete02Icon} size={14} />
          {confirmingDelete ? 'Tap to confirm' : 'Remove'}
        </button>
      </div>
    </div>
  )
}

const WithdrawalAccounts = () => {
  const { modal, modalOpen, handleModalOpen, handleModalClose } =
    useModalControl()

  const { data, isLoading, refetch } =
    useSantiBetQuery<WithdrawalAccountsListResponse>({
      path: '/wallet/withdrawal-accounts',
      queryKey: ['withdrawal-accounts'],
    })

  const {
    data: cryptoData,
    isLoading: isLoadingCrypto,
    refetch: refetchCrypto,
  } = useSantiBetQuery<CryptoWalletResponse>({
    path: '/wallet/crypto/accounts',
    queryKey: ['crypto-withdrawal-accounts'],
  })

  const accounts = data?.data ?? []
  const cryptoAccounts = cryptoData?.data ?? []

  return (
    <div className='flex flex-col gap-2 w-full rounded-lg bg-card p-4 '>
      <div className='flex md:flex-row flex-col md:items-center items-start gap-2.5 justify-between'>
        <h2 className='text-base font-semibold text-black'>
          Withdrawal Accounts
        </h2>
        <Button
          type='button'
          text='Add account'
          variation='plain'
          size='medium'
          className='w-fit! border border-black!'
          onClick={() => handleModalOpen('add-withdrawal-account')}
        />
      </div>
      <main className='flex flex-col gap-2 max-h-150 overflow-y-auto'>
        <span className='text-xs font-semibold text-neutral-10 mt-2'>
          Bank Accounts
        </span>
        {isLoading ? (
          <div className='flex flex-col gap-2'>
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className='h-16 animate-pulse rounded-lg bg-hover' />
            ))}
          </div>
        ) : accounts.length === 0 ? (
          <p className='py-4 text-center text-sm text-neutral-10'>
            No saved bank accounts yet.
          </p>
        ) : (
          <div className='flex flex-col gap-2'>
            {accounts.map((account) => (
              <AccountRow key={account.id} account={account} />
            ))}
          </div>
        )}

        <span className='text-xs font-semibold text-neutral-10 mt-3'>
          Crypto Addresses
        </span>
        {isLoadingCrypto ? (
          <div className='flex flex-col gap-2'>
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className='h-16 animate-pulse rounded-lg bg-hover' />
            ))}
          </div>
        ) : cryptoAccounts.length === 0 ? (
          <p className='py-4 text-center text-sm text-neutral-10'>
            No saved crypto addresses yet.
          </p>
        ) : (
          <div className='flex flex-col gap-2'>
            {cryptoAccounts.map((account) => (
              <CryptoAccountRow key={account.id} account={account} />
            ))}
          </div>
        )}
      </main>

      <AddWithdrawalAccount
        open={modalOpen && modal === 'add-withdrawal-account'}
        handleClose={handleModalClose}
        refetch={() => {
          refetch()
          refetchCrypto()
        }}
      />
    </div>
  )
}

export default WithdrawalAccounts
