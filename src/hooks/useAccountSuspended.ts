import { useAppSelector } from '../utils/hooks'

/** True once the server has told us this account is suspended (read-only). */
const useAccountSuspended = () =>
  useAppSelector((state) => state.accountStatus.suspended)

export default useAccountSuspended
