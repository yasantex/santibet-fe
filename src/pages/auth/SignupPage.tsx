import React from 'react'
import { Link, useNavigate } from 'react-router'
import useUpdateToken from '../../hooks/useUpdateToken'
import { useAppDispatch } from '../../utils/hooks'
import { useFormik } from 'formik'
import { useSantiBetMutation } from '../../data_layer/utils'
import type { LoginResponse } from '../../types/types'
import { SignInSchema } from '../../utils/validations'
import { isAxiosError } from 'axios'
import { showSuccessToast, showWarningToast } from '../../utils/toastUtils'
import { setUser } from '../../redux/userSlice'
import { Button } from '../../components/globals/Button'
import { FormInput } from '../../components/globals/FormInput'

const SignupPage = () => {
  const updateToken = useUpdateToken()
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const { values, handleChange, handleBlur, errors, touched, handleSubmit } =
    useFormik({
      initialValues: {
        email: '',
        password: '',
      },
      validationSchema: SignInSchema,
      onSubmit: async (vals) => {
        try {
          await postLogin({
            email: vals.email,
            password: vals.password,
          })
        } catch {}
      },
    })

  const { mutateAsync: postLogin, isPending } = useSantiBetMutation<
    LoginResponse,
    { email: string; password: string }
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
        const { ...userData } = data.data
        if (userData.two_fa_enabled) {
          navigate(
            `/two-fa?userId=${userData?.user_uuid}&authToken=${userData?.pre_auth_token}`,
          )
          return
        }
        updateToken(data)
        dispatch(setUser(userData))
        showSuccessToast(data?.message)
      },
    },
  })
  return (
    <div className='flex flex-col items-center justify-center w-full mx-auto mt-10 md:mt-20 max-w-100 px-5 md:max-w-125! gap-2.5'>
      <h1 className='text-black font-bold text-center'>Welcome to Santibet</h1>
      <p className='text-sm text-center text-neutral-10'>
        Create an account to start predicting.
      </p>
      <Button
        type='submit'
        text='Sign up with Google'
        variation='plain'
        size='large'
        icon='google-icon'
        iconClassName='mb-1'
      />
      <main className='w-full flex flex-col gap-2.5 mt-2.5'>
        <FormInput
          type='text'
          name='email'
          value={values.email}
          hasTitle
          title='Email address'
          placeholder='email address'
          onChange={handleChange}
          onBlur={handleBlur}
          errors={errors.email && touched.email ? errors.email : ''}
        />

        <FormInput
          type='password'
          name='password'
          value={values.password}
          hasTitle
          title='Password'
          placeholder='must be at least 8 characters'
          onChange={handleChange}
          onBlur={handleBlur}
          errors={errors.password && touched.password ? errors.password : ''}
        />

        <Button
          type='submit'
          text='Sign Up'
          variation='primary'
          className='mt-2.5'
          size='large'
          loading={isPending}
          disabled={isPending}
        />
        <p className='text-sm text-center text-neutral-10'>
          Already have an account?
          <Link
            to={`/signin`}
            className='font-semibold text-black underline underline-offset-3'
          >
            {' '}
            Sign In
          </Link>
        </p>
      </main>
    </div>
  )
}

export default SignupPage
