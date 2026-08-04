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
      'Password must contain letters and numbers'
    ),
  confirmPassword: Yup.string()
    .required('Confirm password is required')
    .oneOf([Yup.ref('newPassword')], 'Passwords must match'),
  token: Yup.string().trim().required('Token is required'),
})