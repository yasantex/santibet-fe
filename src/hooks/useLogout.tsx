import { useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router'
import { useCookies } from 'react-cookie'
import { useSantiBetMutation } from '../data_layer/utils'
import { useAppDispatch } from '../utils/hooks'
import { showSuccessToast } from '../utils/toastUtils'
import { clearUser } from '../redux/userSlice'

const useLogout = () => {
  const queryClient = useQueryClient()
  const [, , removeCookie] = useCookies(['token', 'sb_rt'], {
    doNotParse: true,
  })
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const { mutateAsync: apiLogoutAll, isPending: isPendingAll } =
    useSantiBetMutation<void, void>({ path: '/auth/logout' })

  const deleteAppCookie = (key: 'token' | 'sb_rt') => {
    removeCookie(key, { path: '/', sameSite: 'lax', secure: true })
  }

  const clearAllCookies = () => {
    deleteAppCookie('token')
    deleteAppCookie('sb_rt')
  }

  const handleLogout = async () => {
    try {
      await apiLogoutAll()
      clearAllCookies()
      // clearUser() clears the persisted user slice on the next redux-persist
      // write — purging the whole store here would also wipe favorites and
      // saved categories, which aren't tied to the session.
      dispatch(clearUser())
      queryClient.clear()
      showSuccessToast('Logged out successfully')
      navigate('/')
    } catch (error) {
      console.error(error)
      clearAllCookies()
      dispatch(clearUser())
      showSuccessToast('Logged out successfully')
      navigate('/')
    }
  }

  return { logout: handleLogout, isPendingAll }
}

export default useLogout
