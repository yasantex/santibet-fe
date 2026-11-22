import { useState } from 'react'
import { useFormik } from 'formik'
import * as Yup from 'yup'
import { isAxiosError } from 'axios'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  CheckmarkCircle02Icon,
  WhatsappIcon,
} from '@hugeicons/core-free-icons'
import CustomSelector from '../globals/CustomSelector'
import { FormInput } from '../globals/FormInput'
import { FormSwitch } from '../globals/FormSwitch'
import { Button } from '../globals/Button'
import { useAppSelector } from '../../utils/hooks'
import { useCreateContactMessage } from '../../data_layer/support'
import type {
  ContactMessageResponse,
  ContactTopic,
} from '../../types/support.types'
import type { UserData } from '../../types/types'

const TOPIC_OPTIONS: { label: string; value: ContactTopic }[] = [
  { label: 'General question', value: 'GENERAL' },
  { label: 'My account', value: 'ACCOUNT' },
  { label: 'Deposits & withdrawals', value: 'PAYMENTS' },
  { label: 'Bets & markets', value: 'BETTING' },
  { label: 'Partnerships', value: 'PARTNERSHIP' },
  { label: 'Press', value: 'PRESS' },
  { label: 'Feedback', value: 'FEEDBACK' },
  { label: 'Something else', value: 'OTHER' },
]

const MESSAGE_MIN = 10
const MESSAGE_MAX = 5000

const schema = Yup.object({
  name: Yup.string()
    .trim()
    .min(2, 'Enter at least 2 characters')
    .max(100, 'Keep it under 100 characters')
    .required('Enter your name'),
  email: Yup.string()
    .trim()
    .email('Enter a valid email address')
    .required('Enter your email address'),
  whatsappOptIn: Yup.boolean(),
  // Only asked for (and sent) when the player opts in to WhatsApp.
  phone: Yup.string().when('whatsappOptIn', {
    is: true,
    then: (s) =>
      s
        .trim()
        .required('Enter the number we should message on WhatsApp')
        .min(7, 'Enter a phone number between 7 and 32 characters')
        .max(32, 'Enter a phone number between 7 and 32 characters'),
  }),
  topic: Yup.string().required('Choose what this is about'),
  message: Yup.string()
    .trim()
    .min(MESSAGE_MIN, `Tell us a bit more (at least ${MESSAGE_MIN} characters)`)
    .max(MESSAGE_MAX, `Keep it under ${MESSAGE_MAX.toLocaleString()} characters`)
    .required('Write your message'),
})

type FormValues = {
  name: string
  email: string
  phone: string
  whatsappOptIn: boolean
  topic: ContactTopic | ''
  message: string
  website: string
}

const FIELDS: (keyof FormValues)[] = [
  'name',
  'email',
  'phone',
  'topic',
  'message',
]

const nameOf = (user: UserData | null) =>
  [user?.firstName, user?.lastName].filter(Boolean).join(' ') ||
  user?.displayName ||
  user?.name ||
  ''

const initialValues = (user: UserData | null): FormValues => ({
  name: nameOf(user),
  email: user?.email ?? '',
  phone: user?.phone ?? '',
  whatsappOptIn: false,
  topic: '',
  message: '',
  website: '',
})

/**
 * Which field a 400 is about: a `field` key, or Fastify's "body/phone …"
 * message. Undefined when the error isn't about one field.
 */
const fieldOf = (data: { field?: string; message?: string } | undefined) => {
  const raw =
    data?.field ?? data?.message?.match(/^(?:body\/|body\.)?(\w+)\b/)?.[1]
  return FIELDS.find((f) => f === raw)
}

/**
 * The public "Contact us" form (POST /contact). Works signed in or out;
 * signed-in players get their name and email filled in. Staff reply by email.
 */
const ContactForm = () => {
  const { user } = useAppSelector((state) => state.user)
  const { mutateAsync, isPending } = useCreateContactMessage()
  const [sent, setSent] = useState<ContactMessageResponse | null>(null)
  const [submitError, setSubmitError] = useState('')

  const form = useFormik<FormValues>({
    initialValues: initialValues(user),
    enableReinitialize: true,
    validationSchema: schema,
    onSubmit: async (values, helpers) => {
      setSubmitError('')
      try {
        const phone = values.whatsappOptIn ? values.phone.trim() : ''
        const result = await mutateAsync({
          name: values.name.trim(),
          email: values.email.trim(),
          phone: phone || undefined,
          whatsappOptIn: values.whatsappOptIn,
          topic: values.topic as ContactTopic,
          message: values.message.trim(),
          pageUrl: window.location.href,
          website: values.website,
        })
        setSent(result)
      } catch (error) {
        if (!isAxiosError(error)) {
          setSubmitError('We couldn’t send your message. Please try again.')
          return
        }
        const status = error.response?.status
        const data = error.response?.data
        if (status === 429) {
          setSubmitError(
            'You’ve sent a few messages already. Please wait a few minutes.',
          )
        } else if (status === 400 && data?.code === 'PHONE_INVALID') {
          helpers.setFieldError(
            'phone',
            'That doesn’t look like a valid phone number',
          )
        } else if (status === 400 && fieldOf(data)) {
          helpers.setFieldError(fieldOf(data)!, data.message)
        } else {
          setSubmitError(
            data?.message || 'We couldn’t send your message. Please try again.',
          )
        }
      }
    },
  })

  if (sent) {
    return (
      <section className='mt-8 flex flex-col items-center gap-3 rounded-2xl border border-border p-6 text-center'>
        <HugeiconsIcon
          icon={CheckmarkCircle02Icon}
          size={44}
          className='text-success'
        />
        <h2 className='text-base font-semibold text-black'>Message sent</h2>
        <p className='text-sm text-neutral-10'>
          Thanks, we’ve got your message. Your reference is{' '}
          <span className='font-semibold text-black'>{sent.reference}</span>.
          We’ll reply by email, usually within one working day.
        </p>
        <Button
          type='button'
          variation='plain'
          text='Send another message'
          className='w-fit!'
          onClick={() => {
            form.resetForm({ values: initialValues(user) })
            setSent(null)
          }}
        />
      </section>
    )
  }

  const fieldError = (name: keyof FormValues) =>
    form.touched[name] ? (form.errors[name] as string | undefined) : ''

  return (
    <section className='mt-8 rounded-2xl border border-border p-5'>
      <h2 className='text-lg font-semibold text-black'>Send us a message</h2>
      <p className='mt-1 text-sm text-neutral-10'>
        We’ll reply by email, usually within one working day.
      </p>

      <form
        onSubmit={form.handleSubmit}
        noValidate
        className='mt-5 flex flex-col gap-4'
      >
        <div className='flex flex-col gap-4 sm:flex-row'>
          <FormInput
            type='text'
            name='name'
            hasTitle
            title='Name'
            placeholder='Your name'
            autoComplete='name'
            containerClassName='flex-1'
            value={form.values.name}
            onChange={form.handleChange}
            onBlur={form.handleBlur}
            errors={fieldError('name')}
          />
          <FormInput
            type='email'
            name='email'
            hasTitle
            title='Email'
            placeholder='you@example.com'
            autoComplete='email'
            containerClassName='flex-1'
            value={form.values.email}
            onChange={form.handleChange}
            onBlur={form.handleBlur}
            errors={fieldError('email')}
          />
        </div>

        <CustomSelector
          hasLabel
          label='What is this about?'
          options={TOPIC_OPTIONS}
          value={form.values.topic || null}
          onChange={(selected) => form.setFieldValue('topic', selected)}
          placeholder='Select a topic'
          containerClassName='w-full'
          errors={fieldError('topic')}
        />

        <FormInput
          type='textarea'
          name='message'
          hasTitle
          title='Message'
          placeholder='How can we help?'
          rows={6}
          maxLength={MESSAGE_MAX}
          value={form.values.message}
          onChange={form.handleChange}
          onBlur={form.handleBlur}
          errors={fieldError('message')}
        />

        <div className='flex flex-col gap-4 rounded-xl border border-border p-4'>
          <div className='flex items-center gap-3'>
            <span className='flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-card'>
              <HugeiconsIcon
                icon={WhatsappIcon}
                size={20}
                className='text-black'
              />
            </span>
            <label htmlFor='contact-whatsapp' className='flex-1 cursor-pointer'>
              <span className='block text-sm font-semibold text-black'>
                You can also message me on WhatsApp
              </span>
              <span className='block text-xs text-neutral-10'>
                We’ll still send our reply by email.
              </span>
            </label>
            <FormSwitch
              id='contact-whatsapp'
              showLabel={false}
              checked={form.values.whatsappOptIn}
              onChange={(checked) => {
                form.setFieldValue('whatsappOptIn', !!checked)
                if (!checked) form.setFieldTouched('phone', false, false)
              }}
            />
          </div>

          {form.values.whatsappOptIn && (
            <FormInput
              type='tel'
              name='phone'
              hasTitle
              title='WhatsApp number'
              placeholder='e.g. 0905 006 2474'
              autoComplete='tel'
              value={form.values.phone}
              onChange={form.handleChange}
              onBlur={form.handleBlur}
              errors={fieldError('phone')}
            />
          )}
        </div>

        {/* Spam trap: hidden with CSS (not type="hidden") so bots fill it. */}
        <div
          aria-hidden='true'
          className='absolute -left-[9999px] h-0 w-0 overflow-hidden'
        >
          <label htmlFor='contact-website'>Website</label>
          <input
            id='contact-website'
            type='text'
            name='website'
            tabIndex={-1}
            autoComplete='off'
            value={form.values.website}
            onChange={form.handleChange}
          />
        </div>

        {submitError && (
          <p className='rounded-lg bg-error-bg px-3 py-2 text-sm text-error'>
            {submitError}
          </p>
        )}

        <Button
          type='submit'
          text='Send message'
          className='w-fit!'
          loading={isPending}
          disabled={isPending}
        />
      </form>
    </section>
  )
}

export default ContactForm
