import * as Yup from 'yup'

export const SignInSchema = Yup.object({
  email: Yup.string()
    .email('Email is not a valid email')
    .required('Email is required'),
  password: Yup.string().required('Password is required'),
})

export const ForgotPasswordSchema = Yup.object({
  email: Yup.string()
    .email('Email is not a valid email')
    .required('Email is required'),
})

export const NewPasswordSchema = Yup.object({
  newPassword: Yup.string()
    .required('Password is required')
    .min(8, 'Password must be at least 8 characters')
    .matches(
      /^(?=.*[a-zA-Z])(?=.*\d)/,
      'Password must contain letters and numbers',
    ),
  code: Yup.string().required('Code is required'),
  email: Yup.string().trim().required('Email is required'),
})

export const ChangePasswordSchema = Yup.object({
  currentPassword: Yup.string().required('Current password is required'),
  newPassword: Yup.string()
    .required('Password is required')
    .min(8, 'Password must be at least 8 characters')
    .matches(
      /^(?=.*[a-zA-Z])(?=.*\d)/,
      'Password must contain letters and numbers',
    )
    .notOneOf(
      [Yup.ref('currentPassword')],
      'New password must be different from current password',
    ),
})

export const VerifySchema = Yup.object({
  code: Yup.string().required('Code is required'),
})

export const DisableTwoFactorSchema = Yup.object().shape({
  code: Yup.string().required('Verification code is required'),
  password: Yup.string().required('Password is required'),
})

export const TwoFactorSchema = Yup.object({
  code: Yup.string().required('Authentication code is required'),
})

export const RegenerateRecoveryCodesSchema = Yup.object().shape({
  code: Yup.string().required('Verification code is required'),
})

export const AddWithdrawalAccountSchema = Yup.object().shape({
  accountNumber: Yup.string()
    .matches(/^\d{10}$/, 'Enter a valid 10-digit account number')
    .required('Account number is required'),
  bankCode: Yup.string().required('Bank code is required'),
  label: Yup.string().required('Label is required'),
})
