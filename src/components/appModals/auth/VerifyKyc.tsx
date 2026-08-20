import React from 'react'
import ModalComponent, { type ModalProps } from '../../globals/ModalComponent'
import { Button } from '../../globals/Button'
import { useFormik } from 'formik'
import type { BaseApiResponse } from '../../../types/types'
import { useSantiBetMutation } from '../../../data_layer/utils'
import { isAxiosError } from 'axios'
import { showSuccessToast, showWarningToast } from '../../../utils/toastUtils'
import { FormInput } from '../../globals/FormInput'
import CustomSelector from '../../globals/CustomSelector'
import DateInput from '../../globals/DateInput'

type KycPayload = {
  idType: string
  idNumber: string
  firstName: string
  lastName: string
  dateOfBirth: string
}

const idTypeOptions = [
  {
    label: 'BVN',
    value: 'BVN',
  },
  {
    label: 'NIN',
    value: 'NIN',
  },
  {
    label: "Voter's Card",
    value: "voter's card",
  },
  {
    label: "Driver's Licence",
    value: "driver's licence",
  },
]

const VerifyKyc = ({ open, handleClose }: ModalProps) => {
  const { mutateAsync: postVerify, isPending } = useSantiBetMutation<
    BaseApiResponse,
    KycPayload
  >({
    path: '/kyc/verify',
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
  } = useFormik<KycPayload>({
    initialValues: {
      idType: '',
      idNumber: '',
      firstName: '',
      lastName: '',
      dateOfBirth: '',
    },

    onSubmit: async (vals) => {
      try {
        await postVerify(vals)
      } catch {}
    },
  })

  return (
    <ModalComponent
      open={open}
      handleClose={handleClose}
      title='Verify KYC'
      subtitle='Verify your identity. Your verified legal name will be used to secure future withdrawals and payout accounts.'
      className='max-w-125! w-[90%]!'
    >
      <form
        onSubmit={handleSubmit}
        className='w-full flex flex-col gap-2.5 mt-2.5'
      >
        <CustomSelector
          options={idTypeOptions}
          value={values.idType}
          onChange={(value) => {
            setFieldValue('idType', value)
          }}
          placeholder='Select ID type'
          containerClassName='w-full'
          hasLabel
          label='ID Type'
        />

        <FormInput
          type='text'
          name='idNumber'
          value={values.idNumber}
          hasTitle
          title='ID Number'
          placeholder='Enter ID number'
          onChange={handleChange}
          onBlur={handleBlur}
          errors={errors.idNumber && touched.idNumber ? errors.idNumber : ''}
        />

        <FormInput
          type='text'
          name='firstName'
          value={values.firstName}
          hasTitle
          title='First Name'
          placeholder='Enter first name'
          onChange={handleChange}
          onBlur={handleBlur}
          errors={errors.firstName && touched.firstName ? errors.firstName : ''}
        />

        <FormInput
          type='text'
          name='lastName'
          value={values.lastName}
          hasTitle
          title='Last Name'
          placeholder='Enter last name'
          onChange={handleChange}
          onBlur={handleBlur}
          errors={errors.lastName && touched.lastName ? errors.lastName : ''}
        />
        <DateInput
          value={values.dateOfBirth}
          onChange={(date) => setFieldValue('dateOfBirth', date)}
          placeholder='select date'
          label='Date of Birth'
          errors={
            errors.dateOfBirth && touched.dateOfBirth ? errors.dateOfBirth : ''
          }
          containerClassName='w-full'
        />

        <Button
          type='submit'
          text='Verify KYC'
          variation='primary'
          className='mt-2.5'
          size='large'
          loading={isPending}
          disabled={isPending}
        />
      </form>
    </ModalComponent>
  )
}

export default VerifyKyc
