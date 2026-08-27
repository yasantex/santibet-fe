import { Button } from '../../../components/globals/Button'
import { useFormik } from 'formik'
import type { UserData } from '../../../types/types'
import { useSantiBetMutation } from '../../../data_layer/utils'
import { isAxiosError } from 'axios'
import { showSuccessToast, showWarningToast } from '../../../utils/toastUtils'
import { FormInput } from '../../../components/globals/FormInput'
import DateInput from '../../../components/globals/DateInput'
import { UpdateProfileSchema } from '../../../utils/validations'
import { setUser } from '../../../redux/userSlice'
import { useDispatch } from 'react-redux'

type UpdateProfilePayload = {
  firstName: string | null
  lastName: string | null
  displayName: string | null
  dateOfBirth: string | null
  avatarUrl: string | null
}

const emptyToNull = (value: string) => (value.trim() === '' ? null : value)

type ProfileTabProps = {
  user: UserData
  refetch: () => void
}

const ProfileTab = ({ user, refetch }: ProfileTabProps) => {
  const dispatch = useDispatch()

  const { mutateAsync: patchProfile, isPending } = useSantiBetMutation<
    UserData,
    UpdateProfilePayload
  >({
    path: '/auth/me',
    method: 'PATCH',
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
        showSuccessToast('Profile update successful')
        dispatch(setUser(data))
        refetch()
      },
    },
  })

  const {
    values,
    errors,
    touched,
    handleSubmit,
    handleChange,
    handleBlur,
    setFieldValue,
  } = useFormik<UpdateProfilePayload>({
    enableReinitialize: true,
    validationSchema: UpdateProfileSchema,
    initialValues: {
      firstName: user.firstName ?? '',
      lastName: user.lastName ?? '',
      displayName: user.displayName ?? '',
      dateOfBirth: user.dateOfBirth ?? '',
      avatarUrl: user.avatarUrl ?? '',
    },

    onSubmit: async (vals) => {
      try {
        await patchProfile({
          firstName: emptyToNull(vals.firstName as unknown as string),
          lastName: emptyToNull(vals.lastName as unknown as string),
          displayName: emptyToNull(vals.displayName as unknown as string),
          dateOfBirth: emptyToNull(vals.dateOfBirth as unknown as string),
          avatarUrl: emptyToNull(vals.avatarUrl as unknown as string),
        })
      } catch {}
    },
  })

  return (
    <section className='flex flex-col gap-2.5 max-w-2xl'>
      <div>
        <h2 className='text-sm font-semibold text-black'>
          General Information
        </h2>
        <p className='text-xs text-placeholder'>
          Update your personal details.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className='w-full flex flex-col gap-2.5'
      >
        <FormInput
          type='text'
          name='firstName'
          hasTitle
          title='First name'
          value={values.firstName ?? ''}
          placeholder='Enter first name'
          onChange={handleChange}
          onBlur={handleBlur}
          errors={errors.firstName && touched.firstName ? errors.firstName : ''}
        />

        <FormInput
          type='text'
          name='lastName'
          hasTitle
          title='Last name'
          value={values.lastName ?? ''}
          placeholder='Enter last name'
          onChange={handleChange}
          onBlur={handleBlur}
          errors={errors.lastName && touched.lastName ? errors.lastName : ''}
        />

        {/* <FormInput
          type='text'
          name='displayName'
          hasTitle
          title='Display name'
          value={values.displayName ?? ''}
          placeholder='Enter display name'
          onChange={handleChange}
          onBlur={handleBlur}
          errors={
            errors.displayName && touched.displayName ? errors.displayName : ''
          }
        /> */}

        <div>
          <h2 className='text-sm text-neutral-10 mb-2'>Date of birth</h2>
          <DateInput
            value={(values.dateOfBirth ?? '') as unknown as string}
            onChange={(date) => setFieldValue('dateOfBirth', date)}
            placeholder='select date of birth'
            errors={
              errors.dateOfBirth && touched.dateOfBirth
                ? errors.dateOfBirth
                : ''
            }
            containerClassName='w-full'
          />
        </div>

        <Button
          type='submit'
          text='Save Changes'
          variation='primary'
          className='mt-2.5'
          size='large'
          loading={isPending}
          disabled={isPending}
        />
      </form>
    </section>
  )
}

export default ProfileTab
