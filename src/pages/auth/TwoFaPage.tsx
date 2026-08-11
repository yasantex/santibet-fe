import { Link, useSearchParams } from 'react-router'
import { useFormik } from 'formik'
import { useSantiBetMutation } from '../../data_layer/utils'
import type { AuthResponse } from '../../types/types'
import { isAxiosError } from 'axios'
import { showWarningToast } from '../../utils/toastUtils'
import { Button } from '../../components/globals/Button'
import { FormInput } from '../../components/globals/FormInput'
import { TwoFactorSchema } from '../../utils/validations'
import { useNavigate } from 'react-router'
import { useEffect } from 'react'
import useUpdateToken from '../../hooks/useUpdateToken'
import { useAppDispatch } from '../../utils/hooks'
import { setUser } from '../../redux/userSlice'

const TwoFaPage = () => {
  const [searchParams] = useSearchParams()
  const updateToken = useUpdateToken()
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const authToken = searchParams.get('authToken') || ''

  useEffect(() => {
    if (!authToken) {
      navigate('/signin')
    }
  }, [authToken])

  const { mutateAsync: postVerify, isPending } = useSantiBetMutation<
    AuthResponse,
    { challengeId: string; code: string }
  >({
    path: `/auth/mfa/verify`,
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
        const { ...userData } = data.user

        updateToken({
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
        })
        dispatch(setUser(userData))
        navigate('/')
      },
    },
  })

  const { values, handleChange, handleBlur, errors, touched, handleSubmit } =
    useFormik({
      initialValues: {
        code: '',
        authToken,
      },
      validationSchema: TwoFactorSchema,
      onSubmit: async (vals) => {
        try {
          await postVerify({
            challengeId: vals.authToken,
            code: vals.code,
          })
        } catch {}
      },
    })

  return (
    <div className='flex flex-col items-center justify-center w-full mx-auto mt-10 md:mt-20 max-w-100 px-5 md:max-w-125! gap-2.5'>
      <h1 className='text-black font-bold text-center'>
        Two-Factor Authentication
      </h1>
      <p className='text-sm text-center text-neutral-10'>
        Enter the code from your authenticator app.
      </p>

      <form
        onSubmit={handleSubmit}
        className='w-full flex flex-col gap-2.5 mt-2.5'
      >
        <FormInput
          type='text'
          name='code'
          value={values.code}
          hasTitle
          title='Authentication Code'
          placeholder='enter code'
          onChange={handleChange}
          onBlur={handleBlur}
          errors={errors.code && touched.code ? errors.code : ''}
        />

        <Button
          type='submit'
          text='Verify'
          variation='primary'
          className='mt-2.5'
          size='large'
          loading={isPending}
          disabled={isPending}
        />

        <p className='text-sm text-center text-neutral-10'>
          Back to
          <Link
            to={`/signin`}
            className='font-semibold text-black underline underline-offset-3'
          >
            {' '}
            Login
          </Link>
        </p>
      </form>
    </div>
  )
}

export default TwoFaPage
