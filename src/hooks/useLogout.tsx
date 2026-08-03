import { useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router'
import { persistor } from '../redux/store'
import { useCookies } from 'react-cookie'
import { useSantiBetMutation } from '../data_layer/utils'
import { useAppDispatch } from '../utils/hooks'
import { showSuccessToast, showWarningToast } from '../utils/toastUtils'
import { clearUser } from '../redux/userSlice'

const useLogout = () => {
  const queryClient = useQueryClient()
  const [, , removeCookie] = useCookies(['token'], { doNotParse: true })
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const { mutateAsync: apiLogoutAll, isPending: isPendingAll } =
    useSantiBetMutation<void, void>({ path: '/user/auth/logout-all' })

  const deleteAppCookie = (key: 'token') => {
    removeCookie(key, { path: '/', sameSite: 'lax', secure: true })
  }

  const clearAllCookies = () => {
    deleteAppCookie('token')
  }

  const handleLogout = async () => {
    try {
      // await apiLogoutAll()
      clearAllCookies()
      dispatch(clearUser())
      queryClient.clear()
      await persistor.purge()
      showSuccessToast('Logged out successfully')
      navigate('/')
    } catch (error) {
      console.error(error)
      clearAllCookies()
      dispatch(clearUser())
      showWarningToast('Log out failed. Please try again')
      navigate('/')
    }
  }

  return { logout: handleLogout, isPendingAll }
}

export default useLogout
