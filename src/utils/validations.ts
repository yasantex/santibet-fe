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
