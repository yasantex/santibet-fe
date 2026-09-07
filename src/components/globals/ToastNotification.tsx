import { Toaster } from 'sonner'
import { useNotificationStream } from '../../data_layer/notificationStreamContext'

const ToastNotification = () => {
  useNotificationStream()

  return (
    <Toaster
      position='bottom-right'
      richColors
      theme='light'
      duration={5000}
      closeButton={false}
    />
  )
}

export default ToastNotification
