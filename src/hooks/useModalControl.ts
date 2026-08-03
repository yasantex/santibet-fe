import { useState } from 'react'

export const useModalControl = () => {
  const [modalOpen, setModalOpen] = useState<boolean>(false)
  const [modal, setModal] = useState<string>('')
  const [activeModal, setActiveModal] = useState<string | null>(null)

  const handleModalOpen = (name: string) => {
    setModal(name)
    setModalOpen(true)
    setActiveModal(name)
  }

  const handleModalClose = () => {
    setModal('')
    setModalOpen(false)
    setActiveModal(null)
  }

  return {
    activeModal,
    modal,
    modalOpen,
    setModalOpen,
    handleModalOpen,
    handleModalClose,
  }
}
