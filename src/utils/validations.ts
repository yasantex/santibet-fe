import * as Yup from 'yup'

export const SignInSchema = Yup.object({
  identifier: Yup.string().required('Email or phone number is required'),

  password: Yup.string().required('Password is required'),
})

const phoneRegExp = /^\+?[0-9]{7,15}$/

export const IdentifierSchema = Yup.object().shape({
  identifier: Yup.string()
    .required('Email address or phone number is required')
    .test(
      'is-email-or-phone',
      'Enter a valid email address or phone number',
      (value) =>
        !!value &&
        (Yup.string().email().isValidSync(value) || phoneRegExp.test(value)),
    ),
})

export const PasswordOnlySchema = Yup.object().shape({
  password: Yup.string().required('Password is required'),
})

export const CodeSchema = Yup.object().shape({
  code: Yup.string()
    .required('Enter the code we sent you')
    .matches(/^\d{6}$/, 'Code must be 6 digits'),
})

export const SetPasswordSchema = Yup.object().shape({
  password: Yup.string()
    .required('Password is required')
    .min(8, 'Password must be at least 8 characters'),
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
})

export const AddCryptoWithdrawalAccountSchema = Yup.object().shape({
  address: Yup.string()
    .required('Wallet address is required')
    .min(20, 'Enter a valid wallet address'),
  network: Yup.string().required('Select a network'),
  currency: Yup.string()
    .required('Select a currency')
    .oneOf(['USDC', 'USDT'], 'Unsupported currency'),
  label: Yup.string().optional(),
})

export const VerifyEmailRequestSchema = Yup.object().shape({
  value: Yup.string()
    .required('Email address is required')
    .email('Enter a valid email address'),
})

export const VerifyPhoneRequestSchema = Yup.object().shape({
  value: Yup.string()
    .required('Phone number is required')
    .matches(/^\+?[0-9]{7,15}$/, 'Enter a valid phone number'),
})


export const UpdateProfileSchema = Yup.object({
  firstName: Yup.string()
    .min(1, 'First name must be 1–60 characters')
    .max(60, 'First name must be 1–60 characters')
    .nullable(),
  lastName: Yup.string()
    .min(1, 'Last name must be 1–60 characters')
    .max(60, 'Last name must be 1–60 characters')
    .nullable(),
  displayName: Yup.string()
    .min(3, 'Display name must be 3–30 characters')
    .max(30, 'Display name must be 3–30 characters')
    .matches(
      /^[a-zA-Z0-9._]+$/,
      'Only letters, numbers, dots, and underscores allowed',
    )
    .nullable(),
  dateOfBirth: Yup.date()
    .max(new Date(), 'Date of birth must be in the past')
    .min(new Date(1900, 0, 1), 'Date of birth must be after 1900')
    .nullable(),
  avatarUrl: Yup.string()
    .url('Must be a valid URL')
    .max(2000, 'Avatar URL must be 2000 characters or fewer')
    .nullable(),
})