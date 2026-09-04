import { Toaster } from 'sonner'

const ToastNotification = () => {
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
