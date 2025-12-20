import { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import { ToastContainer, ToastMessage, ToastType } from '../components/Toast'

interface ToastContextValue {
  success: (title: string, message?: string) => void
  error: (title: string, message?: string) => void
  warning: (title: string, message?: string) => void
  info: (title: string, message?: string) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([])

  const addToast = useCallback((type: ToastType, title: string, message?: string, duration?: number) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    setToasts((prev) => [...prev, { id, type, title, message, duration }])
  }, [])

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const success = useCallback((title: string, message?: string) => {
    addToast('success', title, message, 5000)
  }, [addToast])

  const error = useCallback((title: string, message?: string) => {
    addToast('error', title, message, 8000)
  }, [addToast])

  const warning = useCallback((title: string, message?: string) => {
    addToast('warning', title, message, 6000)
  }, [addToast])

  const info = useCallback((title: string, message?: string) => {
    addToast('info', title, message, 5000)
  }, [addToast])

  return (
    <ToastContext.Provider value={{ success, error, warning, info }}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  )
}

export function useToastContext() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToastContext must be used within a ToastProvider')
  }
  return context
}

