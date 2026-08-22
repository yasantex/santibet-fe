import React, { useEffect } from 'react'
import { Link, useNavigate } from 'react-router'
import useUpdateToken from '../../hooks/useUpdateToken'
import { useAppDispatch } from '../../utils/hooks'
import { useFormik } from 'formik'
import { useSantiBetMutation } from '../../data_layer/utils'
import type { AuthResponse } from '../../types/types'
import { SignInSchema } from '../../utils/validations'
import { isAxiosError } from 'axios'
import { showWarningToast } from '../../utils/toastUtils'
import { setUser } from '../../redux/userSlice'
import { Button } from '../../components/globals/Button'
import { FormInput } from '../../components/globals/FormInput'
import {
  startGoogleOAuth,
  getGoogleOAuthCodeVerifier,
  removeGoogleOAuthCodeVerifier,
} from '../../utils/googleAuth'
import * as Yup from 'yup'

const LoginPage = () => {
  const updateToken = useUpdateToken()
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const { values, handleChange, handleBlur, errors, touched, handleSubmit } =
    useFormik({
      initialValues: {
        identifier: '',
        password: '',
      },
      validationSchema: SignInSchema,
      onSubmit: async (vals) => {
        try {
          const isEmail = Yup.string().email().isValidSync(vals.identifier)
          await postLogin({
            ...(isEmail
              ? { email: vals.identifier }
              : { phone: vals.identifier }),
            password: vals.password,
          })
        } catch (error) {
          console.error(error)
        }
      },
    })

  const { mutateAsync: postLogin, isPending } = useSantiBetMutation<
    AuthResponse,
    { email?: string; phone?: string; password: string }
  >({
    path: `/auth/login`,
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
        if (data?.mfaRequired) {
          navigate(`/two-fa?authToken=${data?.challengeId}`)
          return
        }
        updateToken({
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
        })
        dispatch(setUser(data.user))
        navigate('/')
      },
    },
  })

  const { mutateAsync: finishGoogleSignIn } = useSantiBetMutation<
    AuthResponse,
    { code: string; redirectUri: string; codeVerifier: string }
  >({
    path: '/auth/google',
    mutationOptions: {
      onSuccess: (data) => {
        if (data?.mfaRequired) {
          navigate(`/two-fa?authToken=${data?.challengeId}`)
          return
        }
        updateToken({
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
        })
        dispatch(setUser(data?.user))
        navigate('/')
      },
      onError: (error) => {
        showWarningToast(error.message)
        navigate('/signin', { replace: true })
      },
    },
  })

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const code = urlParams.get('code')

    if (!code) {
      return
    }

    const codeVerifier = getGoogleOAuthCodeVerifier()
    const redirectUri = `${window.location.origin}${window.location.pathname}`

    if (!codeVerifier) {
      showWarningToast('Google sign-in failed. Please try again.')
      navigate('/signin', { replace: true })
      return
    }

    finishGoogleSignIn({ code, codeVerifier, redirectUri })
      .catch(() => {
        showWarningToast('Google sign-in failed. Please try again.')
        navigate('/signin', { replace: true })
      })
      .finally(() => {
        removeGoogleOAuthCodeVerifier()
      })
  }, [finishGoogleSignIn, navigate])
  return (
    <div className='flex flex-col items-center justify-center w-full mx-auto mt-10 md:mt-20 max-w-100 px-5 md:max-w-125! gap-2.5'>
      <h1 className='text-black font-bold text-center'>
        Welcome back to Santibet
      </h1>
      <p className='text-sm text-center text-neutral-10'>
        Sign in or your account to start predicting.
      </p>
      <Button
        type='button'
        text='Continue with Google'
        variation='plain'
        size='large'
        icon='google-icon'
        iconClassName='mb-1'
        onClick={() => {
          startGoogleOAuth().catch((error) => {
            showWarningToast(error.message)
          })
        }}
      />
      <form
        onSubmit={handleSubmit}
        className='w-full flex flex-col gap-2.5 mt-2.5'
      >
        <FormInput
          type='text'
          name='identifier'
          value={values.identifier}
          placeholder='Email address or Phone number'
          onChange={handleChange}
          onBlur={handleBlur}
          errors={
            errors.identifier && touched.identifier ? errors.identifier : ''
          }
        />

        <FormInput
          type='password'
          name='password'
          value={values.password}
          placeholder='must be at least 8 characters'
          onChange={handleChange}
          onBlur={handleBlur}
          errors={errors.password && touched.password ? errors.password : ''}
        />

        <Link
          to={`/forgot-password`}
          className='text-sm text-right text-neutral-10'
        >
          Forgot Password?
        </Link>

        <Button
          type='submit'
          text='Sign In'
          variation='primary'
          className='mt-2.5'
          size='large'
          loading={isPending}
          disabled={isPending}
        />
        <p className='text-sm text-center text-neutral-10'>
          Don’t have an account?
          <Link
            to={`/signup`}
            className='font-semibold text-black underline underline-offset-3'
          >
            {' '}
            Sign Up
          </Link>
        </p>
      </form>
    </div>
  )
}

export default LoginPage
