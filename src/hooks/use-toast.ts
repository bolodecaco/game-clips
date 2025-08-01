import { useState, useCallback } from "react"

export interface Toast {
  id: string
  title?: string
  description?: string
  variant?: "default" | "destructive" | "success"
}

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([])

  const toast = useCallback(({ title, description, variant = "default" }: Omit<Toast, "id">) => {
    const id = Math.random().toString(36).substr(2, 9)
    setToasts((prev) => [...prev, { id, title, description, variant }])
    
    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id))
    }, 5000)
    
    return { id }
  }, [])

  const dismiss = useCallback((toastId: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== toastId))
  }, [])

  return {
    toast,
    dismiss,
    toasts,
  }
}
