import React, { useState, useRef, useEffect } from 'react'
import type { AppMode } from '../../types/ui'

interface Props {
  onSend: (message: string, searchQuery?: string) => void
  isStreaming: boolean
  mode: AppMode
  models: { name: string }[]
  selectedModel: string
  onModelChange: (model: string) => void
  sendWithEnter: boolean
  modelsLoading?: boolean
  modelError?: string | null
}

export function Composer({
  onSend,
  isStreaming,
  mode,
  models,
  selectedModel,
  onModelChange,
  sendWithEnter,
  modelsLoading = false,
  modelError = null
}: Props) {
  const [value, setValue] = useState('')
  const [webSearchEnabled, setWebSearchEnabled] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const accentColor = mode === 'web' ? '#3d8bff' : '#00c864'
  const webMode = mode === 'web'

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 160) + 'px'
    }
  }, [value])

  const handleSend = () => {
    if (!value.trim() || isStreaming || (!webMode && !selectedModel)) return
    const searchQuery = webMode && webSearchEnabled ? value : undefined
    onSend(value.trim(), searchQuery)
    setValue('')
  }

  const handleKey = (e: React.KeyboardEvent) => {
    if (sendWithEnter && e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const sendDisabled = !value.trim() || isStreaming || (!webMode && !selectedModel)

  return (
    <div style={{ padding: '12px 16px 16px' }}>
      <div
        className="glass-2"
        style={{
          borderRadius: 'var(--radius-xl)',
          padding: '12px 14px',
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          boxShadow: isStreaming ? 'var(--accent-glow)' : 'none',
          transition: 'box-shadow var(--transition)'
        }}
      >
        {!webMode && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <select
              value={selectedModel}
              onChange={e => onModelChange(e.target.value)}
              disabled={modelsLoading || models.length === 0}
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--text-muted)',
                fontSize: 12,
                padding: '5px 8px',
                cursor: 'pointer',
                outline: 'none',
                flex: 1,
                minWidth: 180,
                maxWidth: 220
              }}
            >
              {modelsLoading && <option value="">Loading models...</option>}
              {!modelsLoading && models.length === 0 && <option value="">No local models found</option>}
              {models.map(model => (
                <option key={model.name} value={model.name}>
                  {model.name}
                </option>
              ))}
            </select>

            <div style={{ flex: 1 }} />
            <span style={{ fontSize: 11, color: 'var(--text-faint)' }}>
              {selectedModel ? `Model: ${selectedModel}` : 'No model selected'}
            </span>
          </div>
        )}

        {modelError && !webMode && (
          <div style={{ fontSize: 12, color: '#ff8f8f' }}>{modelError}</div>
        )}

        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10 }}>
          <textarea
            ref={textareaRef}
            value={value}
            onChange={e => setValue(e.target.value)}
            onKeyDown={handleKey}
            placeholder={webMode ? 'Ask anything...' : 'Ask CRONOS anything...'}
            disabled={isStreaming}
            rows={1}
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: 'var(--text)',
              fontSize: 14,
              lineHeight: 1.6,
              resize: 'none',
              fontFamily: 'var(--font-body)',
              paddingTop: 2,
              opacity: 1,
              cursor: isStreaming ? 'not-allowed' : 'text'
            }}
          />
          <button
            onClick={handleSend}
            disabled={sendDisabled}
            style={{
              width: 36,
              height: 36,
              borderRadius: 'var(--radius-md)',
              background: !sendDisabled
                ? `linear-gradient(135deg, ${accentColor}, ${accentColor}cc)`
                : 'rgba(255,255,255,0.06)',
              border: `1px solid ${!sendDisabled ? `${accentColor}60` : 'var(--border)'}`,
              color: !sendDisabled ? '#000' : 'var(--text-faint)',
              fontSize: 16,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'var(--transition)',
              flexShrink: 0,
              cursor: !sendDisabled ? 'pointer' : 'not-allowed',
              boxShadow: !sendDisabled ? `0 0 12px ${accentColor}40` : 'none'
            }}
          >
            {isStreaming ? (
              <span
                style={{
                  width: 14,
                  height: 14,
                  border: `2px solid ${accentColor}40`,
                  borderTopColor: accentColor,
                  borderRadius: '50%',
                  display: 'block',
                  animation: 'spin 0.8s linear infinite'
                }}
              />
            ) : (
              '↑'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}