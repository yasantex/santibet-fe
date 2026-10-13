import { useState } from 'react'
import { useFormik } from 'formik'
import * as Yup from 'yup'
import { isAxiosError } from 'axios'
import { HugeiconsIcon } from '@hugeicons/react'
import { CheckmarkCircle02Icon } from '@hugeicons/core-free-icons'
import ModalComponent from '../globals/ModalComponent'
import CustomSelector from '../globals/CustomSelector'
import { FormInput } from '../globals/FormInput'
import { Button } from '../globals/Button'
import { useAppSelector } from '../../utils/hooks'
import useAuthNavigate from '../../hooks/useAuthNavigate'
import { useCreateSupportReport } from '../../data_layer/support'
import { chatwoot } from '../../utils/chatwoot'
import { useSupport } from '../../support/supportContext'
import type {
  ReportPrefill,
  SupportReport,
  SupportReportCategory,
} from '../../types/support.types'

const CATEGORY_OPTIONS: { label: string; value: SupportReportCategory }[] = [
  { label: 'Deposit', value: 'DEPOSIT' },
  { label: 'Withdrawal', value: 'WITHDRAWAL' },
  { label: 'Bet or cash-out', value: 'BET' },
  { label: 'Market (odds, rules, resolution)', value: 'MARKET' },
  { label: 'My account', value: 'ACCOUNT' },
  { label: 'Something isn’t working', value: 'TECHNICAL' },
  { label: 'Responsible gambling', value: 'RESPONSIBLE_GAMBLING' },
  { label: 'Other', value: 'OTHER' },
]

// Categories where a transaction/bet reference speeds up the investigation.
const REFERENCE_CATEGORIES: SupportReportCategory[] = [
  'DEPOSIT',
  'WITHDRAWAL',
  'BET',
]

const MESSAGE_MIN = 10
const MESSAGE_MAX = 2000

const schema = Yup.object({
  category: Yup.string().required('Choose what this is about'),
  message: Yup.string()
    .trim()
    .min(MESSAGE_MIN, `Tell us a bit more (at least ${MESSAGE_MIN} characters)`)
    .max(MESSAGE_MAX, `Keep it under ${MESSAGE_MAX} characters`)
    .required('Describe the issue'),
  reference: Yup.string().trim().max(100, 'Reference is too long'),
})

type FormValues = {
  category: SupportReportCategory | ''
  message: string
  reference: string
}

type Props = {
  prefill?: ReportPrefill
  onClose: () => void
}

/**
 * "Report an issue" — files a structured ticket into the Chatwoot support
 * inbox via our backend, with page/market context attached automatically.
 * Complements live chat: a report survives the user leaving, and agents get a
 * categorised, referenced ticket instead of a free-form first message.
 */
const ReportIssueModal = ({ prefill, onClose }: Props) => {
  const { user } = useAppSelector((state) => state.user)
  const authNavigate = useAuthNavigate()
  const { chatAvailable, openChat } = useSupport()
  const { mutateAsync, isPending } = useCreateSupportReport()
  const [submitted, setSubmitted] = useState<SupportReport | null>(null)
  const [submitError, setSubmitError] = useState('')

  const form = useFormik<FormValues>({
    initialValues: {
      category: prefill?.category ?? (prefill?.marketId ? 'MARKET' : ''),
      message: '',
      reference: prefill?.reference ?? '',
    },
    validationSchema: schema,
    onSubmit: async (values) => {
      setSubmitError('')
      try {
        const result = await mutateAsync({
          category: values.category as SupportReportCategory,
          message: values.message.trim(),
          reference: values.reference.trim() || undefined,
          context: {
            pageUrl: window.location.href,
            userAgent: navigator.userAgent,
            marketId: prefill?.marketId,
            marketTitle: prefill?.marketTitle,
          },
        })
        // Surface the ticket on the chat contact too, so an agent picking up a
        // live chat can see the user already filed a report.
        chatwoot.setCustomAttributes({
          last_report_ticket: result.ticketNumber,
          last_report_category: result.category,
        })
        setSubmitted(result)
      } catch (error) {
        setSubmitError(
          isAxiosError(error) && error.response?.data?.message
            ? error.response.data.message
            : 'We couldn’t submit your report. Please try again.',
        )
      }
    },
  })

  const continueInChat = () => {
    onClose()
    openChat()
  }

  const showReference =
    !!form.values.reference ||
    REFERENCE_CATEGORIES.includes(form.values.category as SupportReportCategory)

  return (
    <ModalComponent
      open
      handleClose={onClose}
      title={submitted ? undefined : 'Report an issue'}
      subtitle={
        submitted
          ? undefined
          : 'Our support team reviews every report. You’ll get a reply by email and in your notifications.'
      }
      className='max-w-lg!'
    >
      {!user ? (
        <div className='flex flex-col gap-4 pt-2'>
          <p className='text-sm text-neutral-10'>
            Sign in so we can link the report to your account and follow up with
            you.
          </p>
          <div className='flex flex-wrap gap-3'>
            <Button
              type='button'
              text='Sign in'
              onClick={() => {
                onClose()
                authNavigate('/signin')
              }}
            />
            {chatAvailable && (
              <Button
                type='button'
                variation='plain'
                text='Chat with us instead'
                onClick={continueInChat}
              />
            )}
          </div>
        </div>
      ) : submitted ? (
        <div className='flex flex-col items-center gap-3 py-4 text-center'>
          <HugeiconsIcon
            icon={CheckmarkCircle02Icon}
            size={44}
            className='text-success'
          />
          <h2 className='text-base font-semibold text-black'>
            Report submitted
          </h2>
          <p className='text-sm text-neutral-10'>
            Your ticket number is{' '}
            <span className='font-semibold text-black'>
              {submitted.ticketNumber}
            </span>
            . Quote it if you contact us about this again.
          </p>
          <div className='mt-2 flex flex-wrap justify-center gap-3'>
            {chatAvailable && (
              <Button
                type='button'
                text='Continue in live chat'
                onClick={continueInChat}
              />
            )}
            <Button
              type='button'
              variation='plain'
              text='Done'
              onClick={onClose}
            />
          </div>
        </div>
      ) : (
        <form onSubmit={form.handleSubmit} className='flex flex-col gap-4 pt-2'>
          {prefill?.marketTitle && (
            <div className='rounded-lg bg-card px-3 py-2 text-xs text-neutral-10'>
              About market:{' '}
              <span className='font-semibold text-black'>
                {prefill.marketTitle}
              </span>
            </div>
          )}

          <CustomSelector
            hasLabel
            label='What is this about?'
            options={CATEGORY_OPTIONS}
            value={form.values.category || null}
            onChange={(selected) => form.setFieldValue('category', selected)}
            placeholder='Select a topic'
            containerClassName='w-full'
            errors={form.touched.category ? form.errors.category : ''}
          />

          {showReference && (
            <FormInput
              type='text'
              name='reference'
              hasTitle
              title='Reference'
              optional
              subTitle='Transaction, deposit or bet reference, if you have one.'
              placeholder='e.g. DEP-8F2K1'
              value={form.values.reference}
              onChange={form.handleChange}
              onBlur={form.handleBlur}
              errors={form.touched.reference ? form.errors.reference : ''}
            />
          )}

          <FormInput
            type='textarea'
            name='message'
            hasTitle
            title='Describe the issue'
            placeholder='What happened, and what did you expect?'
            rows={5}
            maxLength={MESSAGE_MAX}
            value={form.values.message}
            onChange={form.handleChange}
            onBlur={form.handleBlur}
            errors={form.touched.message ? form.errors.message : ''}
          />

          {submitError && (
            <p className='rounded-lg bg-error-bg px-3 py-2 text-sm text-error'>
              {submitError}
            </p>
          )}

          <div className='flex flex-wrap items-center justify-between gap-3'>
            {chatAvailable ? (
              <button
                type='button'
                onClick={continueInChat}
                className='text-sm font-semibold text-black underline underline-offset-2'
              >
                Need help now? Chat live
              </button>
            ) : (
              <span />
            )}
            <Button
              type='submit'
              text='Submit report'
              loading={isPending}
              disabled={isPending}
            />
          </div>
        </form>
      )}
    </ModalComponent>
  )
}

export default ReportIssueModal
