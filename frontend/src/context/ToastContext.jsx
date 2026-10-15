import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { IconCheck, IconAlertTriangle, IconShield, IconX } from '../components/Icons'

const ToastContext = createContext(null)

// Helper global agar bisa dipanggil dari luar React tree (misal Axios interceptor di api.js)
export const emitToast = (message, type = 'error', title = '') => {
  window.dispatchEvent(
    new CustomEvent('sipaku-toast', {
      detail: { message, type, title, id: Date.now() + Math.random() }
    })
  )
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const addToast = useCallback((message, type = 'info', title = '', duration = 5000) => {
    const id = Date.now() + Math.random()
    const newToast = { id, message, type, title }

    setToasts((prev) => [...prev, newToast])

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id)
      }, duration)
    }

    return id
  }, [removeToast])

  // Listener event global 'sipaku-toast'
  useEffect(() => {
    const handleGlobalToast = (event) => {
      const { message, type, title } = event.detail || {}
      if (message) {
        addToast(message, type || 'error', title || '', 5000)
      }
    }

    window.addEventListener('sipaku-toast', handleGlobalToast)
    return () => {
      window.removeEventListener('sipaku-toast', handleGlobalToast)
    }
  }, [addToast])

  // Helper cepat
  const toast = {
    success: (msg, title) => addToast(msg, 'success', title || 'Berhasil'),
    error: (msg, title) => addToast(msg, 'error', title || 'Terjadi Kesalahan'),
    warning: (msg, title) => addToast(msg, 'warning', title || 'Peringatan'),
    info: (msg, title) => addToast(msg, 'info', title || 'Informasi'),
  }

  return (
    <ToastContext.Provider value={{ addToast, removeToast, toast }}>
      {children}

      {/* Floating Toast Notification Container */}
      <aside
        aria-label="Notifikasi Sistem"
        aria-live="polite"
        style={{
          position: 'fixed',
          top: 24,
          right: 24,
          zIndex: 99999,
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
          maxWidth: 420,
          width: 'calc(100vw - 48px)',
          pointerEvents: 'none',
          fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif"
        }}
      >
        {toasts.map((t) => {
          let borderColor = '#e2e8f0'
          let iconColor = '#0284c7'
          let bgColor = '#ffffff'
          let badgeBg = '#eff6ff'
          let defaultTitle = 'Pemberitahuan'
          let IconComponent = IconShield

          if (t.type === 'error') {
            borderColor = '#fecaca'
            iconColor = '#dc2626'
            badgeBg = '#fef2f2'
            defaultTitle = 'Kesalahan Sistem'
            IconComponent = IconAlertTriangle
          } else if (t.type === 'warning') {
            borderColor = '#fde68a'
            iconColor = '#d97706'
            badgeBg = '#fffbeb'
            defaultTitle = 'Perhatian'
            IconComponent = IconAlertTriangle
          } else if (t.type === 'success') {
            borderColor = '#a7f3d0'
            iconColor = '#059669'
            badgeBg = '#ecfdf5'
            defaultTitle = 'Operasi Berhasil'
            IconComponent = IconCheck
          }

          return (
            <div
              key={t.id}
              role="alert"
              style={{
                pointerEvents: 'auto',
                background: bgColor,
                border: `1px solid ${borderColor}`,
                borderRadius: 12,
                padding: '14px 16px',
                boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.12), 0 8px 10px -6px rgba(15, 23, 42, 0.08)',
                display: 'flex',
                alignItems: 'flex-start',
                gap: 12,
                animation: 'slideInRight 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                transition: 'all 0.2s ease',
              }}
            >
              {/* Type Icon Badge */}
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  background: badgeBg,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  marginTop: 1
                }}
              >
                <IconComponent size={16} color={iconColor} />
              </div>

              {/* Text Body */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 750,
                    color: '#0f172a',
                    lineHeight: 1.3,
                    marginBottom: 2
                  }}
                >
                  {t.title || defaultTitle}
                </div>
                <div
                  style={{
                    fontSize: 12.5,
                    color: '#475569',
                    lineHeight: 1.45,
                    wordBreak: 'break-word'
                  }}
                >
                  {t.message}
                </div>
              </div>

              {/* Close Button */}
              <button
                type="button"
                onClick={() => removeToast(t.id)}
                aria-label="Tutup notifikasi"
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  padding: 4,
                  borderRadius: 6,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  marginTop: -2,
                  marginRight: -4,
                  transition: 'color 0.15s, background 0.15s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = '#0f172a'
                  e.currentTarget.style.background = '#f1f5f9'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = '#94a3b8'
                  e.currentTarget.style.background = 'transparent'
                }}
              >
                <IconX size={15} color="currentColor" />
              </button>
            </div>
          )
        })}
      </aside>
    </ToastContext.Provider>
  )
}

export const useToast = () => {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast harus digunakan di dalam <ToastProvider>')
  return ctx
}
