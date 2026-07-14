import React, { useEffect, useState } from 'react'
import type { AppSettings } from '../../store/settingsStore'
import { api } from '../../lib/api'

interface Props {
  settings: AppSettings
  onSave: (settings: Partial<AppSettings>) => void | Promise<void>
  onClose: () => void
  models: { name: string }[]
  pullProgress: number
  onPullModel: (name: string) => void | Promise<void>
  onDeleteModel: (name: string) => void | Promise<void>
}

export function SettingsPanel({
  settings,
  onSave,
  onClose
}: Props) {
  const [localModel, setLocalModel] = useState(settings.localModel)
  const [webModel, setWebModel] = useState(settings.webModel)
  const [sendWithEnter, setSendWithEnter] = useState(settings.sendWithEnter)
  const [ollamaBaseUrl, setOllamaBaseUrl] = useState(settings.ollamaBaseUrl)
  const [searxngBaseUrl, setSearxngBaseUrl] = useState(settings.searxngBaseUrl)
  const [testingSearxng, setTestingSearxng] = useState(false)
  const [searxngStatus, setSearxngStatus] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setLocalModel(settings.localModel)
    setWebModel(settings.webModel)
    setSendWithEnter(settings.sendWithEnter)
    setOllamaBaseUrl(settings.ollamaBaseUrl)
    setSearxngBaseUrl(settings.searxngBaseUrl)
  }, [settings])

  const handleSave = async () => {
    setSaving(true)
    setSearxngStatus(null)

    try {
      await onSave({
        localModel,
        webModel,
        sendWithEnter,
        ollamaBaseUrl,
        searxngBaseUrl
      })
      onClose()
    } finally {
      setSaving(false)
    }
  }

  const handleTestSearxng = async () => {
    setTestingSearxng(true)
    setSearxngStatus(null)

    try {
      await onSave({ searxngBaseUrl })
      const res = await api.testSearxng()
      if (res.success) {
        setSearxngStatus('SearXNG connected successfully.')
      } else {
        setSearxngStatus(res.error || 'SearXNG test failed.')
      }
    } catch (err) {
      setSearxngStatus(err instanceof Error ? err.message : String(err))
    } finally {
      setTestingSearxng(false)
    }
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.36)',
        backdropFilter: 'blur(10px)',
        zIndex: 40,
        display: 'grid',
        placeItems: 'center',
        padding: 20
      }}
      onClick={onClose}
    >
      <div
        className="glass-2"
        onClick={e => e.stopPropagation()}
        style={{
          width: 'min(720px, 100%)',
          borderRadius: 'var(--radius-xl)',
          border: '1px solid var(--border)',
          boxShadow: 'var(--shadow-lg)',
          overflow: 'hidden'
        }}
      >
        <div
          style={{
            padding: '16px 18px',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>
              Settings
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-faint)', marginTop: 4 }}>
              Configure CRONOS local and web services.
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              width: 32,
              height: 32,
              borderRadius: 10,
              border: '1px solid var(--border)',
              background: 'rgba(255,255,255,0.04)',
              color: 'var(--text-faint)'
            }}
          >
            ×
          </button>
        </div>

        <div
          style={{
            padding: 18,
            display: 'grid',
            gap: 16
          }}
        >
          <div>
            <label style={{ display: 'block', fontSize: 12, color: 'var(--text-faint)', marginBottom: 6 }}>
              Ollama Base URL
            </label>
            <input
              value={ollamaBaseUrl}
              onChange={e => setOllamaBaseUrl(e.target.value)}
              placeholder="http://127.0.0.1:11434"
              style={{
                width: '100%',
                padding: '11px 12px',
                borderRadius: 12,
                border: '1px solid var(--border)',
                background: 'rgba(255,255,255,0.04)',
                color: 'var(--text)',
                outline: 'none'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 12, color: 'var(--text-faint)', marginBottom: 6 }}>
              SearXNG Base URL
            </label>
            <div style={{ display: 'flex', gap: 10 }}>
              <input
                value={searxngBaseUrl}
                onChange={e => setSearxngBaseUrl(e.target.value)}
                placeholder="http://127.0.0.1:8080"
                style={{
                  flex: 1,
                  padding: '11px 12px',
                  borderRadius: 12,
                  border: '1px solid var(--border)',
                  background: 'rgba(255,255,255,0.04)',
                  color: 'var(--text)',
                  outline: 'none'
                }}
              />
              <button
                onClick={handleTestSearxng}
                disabled={testingSearxng}
                style={{
                  padding: '0 14px',
                  borderRadius: 12,
                  border: '1px solid var(--border)',
                  background: 'rgba(255,255,255,0.05)',
                  color: 'var(--text)',
                  fontWeight: 600,
                  cursor: testingSearxng ? 'wait' : 'pointer'
                }}
              >
                {testingSearxng ? 'Testing...' : 'Test'}
              </button>
            </div>

            {searxngStatus && (
              <div
                style={{
                  marginTop: 8,
                  fontSize: 12,
                  color: searxngStatus.includes('successfully') ? '#7df0a8' : '#ff9f9f'
                }}
              >
                {searxngStatus}
              </div>
            )}
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '10px 12px',
              borderRadius: 12,
              border: '1px solid var(--border)',
              background: 'rgba(255,255,255,0.03)'
            }}
          >
            <div>
              <div style={{ fontSize: 13, color: 'var(--text)', fontWeight: 600 }}>
                Send with Enter
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-faint)', marginTop: 2 }}>
                Press Shift+Enter for a new line.
              </div>
            </div>

            <input
              type="checkbox"
              checked={sendWithEnter}
              onChange={e => setSendWithEnter(e.target.checked)}
            />
          </div>
        </div>

        <div
          style={{
            padding: '14px 18px',
            borderTop: '1px solid var(--border)',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 10
          }}
        >
          <button
            onClick={onClose}
            style={{
              padding: '10px 14px',
              borderRadius: 12,
              border: '1px solid var(--border)',
              background: 'rgba(255,255,255,0.04)',
              color: 'var(--text)'
            }}
          >
            Cancel
          </button>

          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              padding: '10px 14px',
              borderRadius: 12,
              border: '1px solid rgba(0,200,100,0.28)',
              background: 'linear-gradient(135deg, rgba(0,200,100,0.22), rgba(0,200,100,0.12))',
              color: '#7df0a8',
              fontWeight: 700,
              cursor: saving ? 'wait' : 'pointer'
            }}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  )
}