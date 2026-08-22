import React, { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { useFormik } from 'formik'
import { useAppDispatch, useAppSelector } from '../../utils/hooks'
import { useSantiBetMutation } from '../../data_layer/utils'
import type { BaseApiResponse } from '../../types/types'
import { isAxiosError } from 'axios'
import { showSuccessToast, showWarningToast } from '../../utils/toastUtils'
import { VerifySchema } from '../../utils/validations'
import { Button } from '../../components/globals/Button'
import { OtpInput } from '../../components/globals/OtpInput'
import { clearSignupType } from '../../redux/userSlice'

const RESEND_COOLDOWN_SECONDS = 60

const VerifyAccountPage = () => {
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const [searchParams] = useSearchParams()
  const type = searchParams.get('type') === 'phone' ? 'phone' : 'email'
  const { user } = useAppSelector((state) => state.user)
  //   const hasSentInitialCode = useRef(false)

  const [secondsLeft, setSecondsLeft] = useState(RESEND_COOLDOWN_SECONDS)

  useEffect(() => {
    if (secondsLeft <= 0) {
      return
    }
    const timer = setInterval(() => {
      setSecondsLeft((prev) => Math.max(prev - 1, 0))
    }, 1000)
    return () => clearInterval(timer)
  }, [secondsLeft])

  const { mutateAsync: requestCode, isPending: isRequesting } =
    useSantiBetMutation<BaseApiResponse, { phone?: string }>({
      path: `/auth/verify/${type}/request`,
      mutationOptions: {
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

  const { mutateAsync: postVerify, isPending } = useSantiBetMutation<
    BaseApiResponse,
    { code: string }
  >({
    path: `/auth/verify/${type}/confirm`,
    mutationOptions: {
      onError: (error) => {
        if (isAxiosError(error)) {
          const errorData = error.response?.data
          showWarningToast(errorData?.message)
        } else {
          showWarningToast(error.message)
        }
      },
      onSuccess: (data) => {
        showSuccessToast(data?.message)
        dispatch(clearSignupType())
        navigate('/')
      },
    },
  })

  const {
    values,
    errors,
    touched,
    handleSubmit,
    setFieldValue,
    setFieldTouched,
  } = useFormik({
    initialValues: { code: '' },
    validationSchema: VerifySchema,
    onSubmit: async (vals) => {
      try {
        await postVerify({ code: vals.code })
      } catch {}
    },
  })

  //   useEffect(() => {
  //     if (hasSentInitialCode.current) {
  //       return
  //     }
  //     hasSentInitialCode.current = true
  //     requestCode(type === 'phone' ? { phone: user?.phone ?? '' } : {}).catch(
  //       () => {},
  //     )
  //   }, [requestCode, type, user?.phone])

  const handleResend = () => {
    if (secondsLeft > 0) {
      return
    }
    requestCode(type === 'phone' ? { phone: user?.phone ?? '' } : {})
      .then(() => {
        showSuccessToast('Code resent')
        setSecondsLeft(RESEND_COOLDOWN_SECONDS)
      })
      .catch(() => {})
  }

  return (
    <div className='flex flex-col items-center justify-center w-full mx-auto mt-10 md:mt-20 max-w-100 px-5 md:max-w-125! gap-2.5'>
      <h1 className='text-black font-bold text-center'>
        Verify your {type === 'phone' ? 'phone number' : 'email'}
      </h1>
      <p className='text-sm text-center text-neutral-10'>
        {type === 'phone'
          ? `We sent a code to ${user?.phone ?? 'your phone number'}.`
          : `We sent a code to ${user?.email ?? 'your email address'}.`}
      </p>

      <form
        onSubmit={handleSubmit}
        className='w-full flex flex-col gap-2.5 mt-2.5'
      >
        <OtpInput
          length={6}
          name='code'
          value={values.code}
          hasTitle
          title='Enter Code'
          onChange={(val) => setFieldValue('code', val)}
          onComplete={() => setFieldTouched('code', true)}
          errors={errors.code && touched.code ? errors.code : ''}
        />

        <Button
          type='submit'
          text={`Verify ${type === 'phone' ? 'Phone' : 'Email'}`}
          variation='primary'
          className='mt-2.5'
          size='large'
          loading={isPending}
          disabled={isPending}
        />

        <button
          type='button'
          onClick={handleResend}
          disabled={isRequesting || secondsLeft > 0}
          className='text-sm text-center text-neutral-10 cursor-pointer hover:text-black underline underline-offset-3 disabled:opacity-50 disabled:no-underline'
        >
          {secondsLeft > 0
            ? `Resend in ${secondsLeft}s`
            : "Didn't get a code? Resend"}
        </button>
      </form>
    </div>
  )
}

export default VerifyAccountPage
