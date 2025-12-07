// קומפוננטת מודל אישור משותפת לכל האפליקציה

import { useState, useEffect } from 'react'
import { COLORS } from '../utils/constants'

export interface ConfirmModalConfig {
  isOpen: boolean
  title: string
  message: string
  confirmText: string
  cancelText?: string
  onConfirm: (inputValue?: string) => void
  onCancel?: () => void
  type?: 'warning' | 'danger' | 'info' | 'success'
  hasInput?: boolean
  inputPlaceholder?: string
  inputType?: 'text' | 'password' | 'number'
}

interface ConfirmModalProps {
  config: ConfirmModalConfig | null
  onClose: () => void
}

export function ConfirmModal({ config, onClose }: ConfirmModalProps) {
  const [inputValue, setInputValue] = useState('')

  useEffect(() => {
    if (config?.isOpen) {
      setInputValue('')
    }
  }, [config?.isOpen])

  if (!config || !config.isOpen) return null

  const typeColors: Record<string, string> = {
    warning: COLORS.WARNING,
    danger: COLORS.ERROR,
    info: COLORS.INFO,
    success: COLORS.SUCCESS,
  }

  const bgColor = typeColors[config.type || 'warning']

  const handleConfirm = () => {
    config.onConfirm(config.hasInput ? inputValue : undefined)
    onClose()
  }

  const handleCancel = () => {
    config.onCancel?.()
    onClose()
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10000,
      }}
      onClick={handleCancel}
    >
      <div
        style={{
          backgroundColor: 'white',
          borderRadius: '10px',
          padding: '30px',
          maxWidth: '450px',
          width: '90%',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)',
          textAlign: 'center',
          direction: 'rtl',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3
          style={{
            marginBottom: '20px',
            color: bgColor,
            fontSize: '20px',
          }}
        >
          {config.title}
        </h3>

        <p
          style={{
            marginBottom: config.hasInput ? '15px' : '30px',
            lineHeight: '1.6',
            fontSize: '16px',
            color: '#2c3e50',
            whiteSpace: 'pre-line',
          }}
        >
          {config.message}
        </p>

        {config.hasInput && (
          <input
            type={config.inputType || 'text'}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={config.inputPlaceholder || ''}
            style={{
              width: '100%',
              padding: '12px',
              fontSize: '16px',
              border: '2px solid #ddd',
              borderRadius: '8px',
              marginBottom: '20px',
              boxSizing: 'border-box',
              textAlign: 'right',
            }}
            autoFocus
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleConfirm()
              }
            }}
          />
        )}

        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
          <button
            onClick={handleConfirm}
            style={{
              backgroundColor: bgColor,
              color: 'white',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '5px',
              fontSize: '16px',
              cursor: 'pointer',
              fontWeight: 'bold',
              minWidth: '100px',
            }}
          >
            {config.confirmText}
          </button>

          {config.cancelText && (
            <button
              onClick={handleCancel}
              style={{
                backgroundColor: '#95a5a6',
                color: 'white',
                border: 'none',
                padding: '12px 24px',
                borderRadius: '5px',
                fontSize: '16px',
                cursor: 'pointer',
                fontWeight: 'bold',
                minWidth: '100px',
              }}
            >
              {config.cancelText}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// Hook לשימוש נוח במודל אישור
export function useConfirmModal() {
  const [config, setConfig] = useState<ConfirmModalConfig | null>(null)

  const showConfirm = (options: Omit<ConfirmModalConfig, 'isOpen'>) => {
    setConfig({
      isOpen: true,
      cancelText: 'ביטול',
      type: 'warning',
      ...options,
    })
  }

  const closeModal = () => {
    setConfig(null)
  }

  return {
    config,
    showConfirm,
    closeModal,
    ConfirmModalComponent: () => <ConfirmModal config={config} onClose={closeModal} />,
  }
}

export default ConfirmModal
