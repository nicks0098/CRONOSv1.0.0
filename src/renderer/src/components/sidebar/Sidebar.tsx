import React, { useEffect, useRef, useState } from 'react'
import type { UIChat, AppMode } from '../../types/ui'

interface Props {
  mode: AppMode
  chats: UIChat[]
  activeChatId: string | null
  onSelect: (id: string) => void
  onDelete: (id: string) => void
  onRename: (id: string, title: string) => void | Promise<void>
  onNewChat: () => void
  ollamaOnline: boolean
}

function PencilIcon({ color }: { color: string }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M4 20h4l10.5-10.5a2.121 2.121 0 0 0-3-3L5 17v3Z"
        stroke={color}
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="m13.5 6.5 4 4"
        stroke={color}
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function TrashIcon({ color }: { color: string }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M3 6h18" stroke={color} strokeWidth="1.7" strokeLinecap="round" />
      <path
        d="M8 6V4.5A1.5 1.5 0 0 1 9.5 3h5A1.5 1.5 0 0 1 16 4.5V6"
        stroke={color}
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M6.5 6l1 13a2 2 0 0 0 1.994 1.846h5.012A2 2 0 0 0 16.5 19l1-13"
        stroke={color}
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M10 10.5v6M14 10.5v6" stroke={color} strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  )
}

function CheckIcon({ color }: { color: string }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M5 12.5 9.5 17 19 7.5"
        stroke={color}
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function CloseIcon({ color }: { color: string }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="m6 6 12 12M18 6 6 18" stroke={color} strokeWidth="1.9" strokeLinecap="round" />
    </svg>
  )
}

function CronosMark({ color }: { color: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="4" y="5" width="16" height="12" rx="4" stroke={color} strokeWidth="1.8" />
      <path
        d="M9 3.5v3M15 3.5v3M9.5 11.5h.01M14.5 11.5h.01"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M9 15c.9-.8 1.9-1.2 3-1.2s2.1.4 3 1.2"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  )
}

export function Sidebar({
  mode,
  chats,
  activeChatId,
  onSelect,
  onDelete,
  onRename,
  onNewChat,
  ollamaOnline
}: Props) {
  const isWeb = mode === 'web'
  const accentColor = isWeb ? '#3d8bff' : '#00c864'
  const modeLabel = isWeb ? 'Web Live' : 'Local'
  const historyLabel = isWeb ? 'Sessions' : 'History'
  const newChatLabel = isWeb ? 'New Session' : 'New Chat'

  const [hoveredChatId, setHoveredChatId] = useState<string | null>(null)
  const [editingChatId, setEditingChatId] = useState<string | null>(null)
  const [draftTitle, setDraftTitle] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (editingChatId && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [editingChatId])

  const beginRename = (chat: UIChat) => {
    setEditingChatId(chat.id)
    setDraftTitle(chat.title)
  }

  const cancelRename = () => {
    setEditingChatId(null)
    setDraftTitle('')
  }

  const submitRename = async (chat: UIChat) => {
    const trimmed = draftTitle.trim()
    if (!trimmed) {
      cancelRename()
      return
    }

    if (trimmed !== chat.title) {
      await onRename(chat.id, trimmed)
    }

    cancelRename()
  }

  return (
    <div
      className="glass"
      style={{
        width: 240,
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        borderRight: `1px solid var(--border)`,
        transition: 'all var(--transition-slow)',
        position: 'relative',
        zIndex: 1
      }}
    >
      <div
        style={{
          padding: '18px 16px 12px',
          borderBottom: `1px solid var(--border)`,
          display: 'flex',
          alignItems: 'center',
          gap: 10
        }}
      >
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 'var(--radius-md)',
            background: `linear-gradient(135deg, ${accentColor}30, ${accentColor}10)`,
            border: `1px solid ${accentColor}40`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <CronosMark color={accentColor} />
        </div>

        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>CRONOS</div>
          <div style={{ fontSize: 11, color: accentColor, fontWeight: 500 }}>{modeLabel}</div>
        </div>
      </div>

      <div style={{ padding: '10px 8px 6px' }}>
        <button
          onClick={onNewChat}
          style={{
            width: '100%',
            padding: '9px 12px',
            background: `linear-gradient(135deg, ${accentColor}20, ${accentColor}10)`,
            border: `1px solid ${accentColor}30`,
            borderRadius: 'var(--radius-md)',
            color: accentColor,
            fontSize: 13,
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            transition: 'var(--transition)',
            cursor: 'pointer'
          }}
          onMouseEnter={e => {
            ;(e.currentTarget as HTMLElement).style.background =
              `linear-gradient(135deg, ${accentColor}30, ${accentColor}20)`
          }}
          onMouseLeave={e => {
            ;(e.currentTarget as HTMLElement).style.background =
              `linear-gradient(135deg, ${accentColor}20, ${accentColor}10)`
          }}
        >
          <span style={{ fontSize: 16, lineHeight: 1 }}>+</span> {newChatLabel}
        </button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', paddingTop: 4 }}>
        <div
          style={{
            padding: '6px 16px 4px',
            fontSize: 11,
            color: 'var(--text-faint)',
            fontWeight: 600,
            letterSpacing: '0.08em',
            textTransform: 'uppercase'
          }}
        >
          {historyLabel}
        </div>

        <div style={{ padding: '0 8px 8px' }}>
          {chats.map(chat => {
            const active = chat.id === activeChatId
            const hovered = hoveredChatId === chat.id
            const editing = editingChatId === chat.id
            const iconColor = active ? accentColor : 'var(--text-faint)'

            return (
              <div
                key={chat.id}
                onMouseEnter={() => setHoveredChatId(chat.id)}
                onMouseLeave={() => setHoveredChatId(prev => (prev === chat.id ? null : prev))}
                style={{ position: 'relative', marginBottom: 6 }}
              >
                {editing ? (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      padding: '6px',
                      borderRadius: 'var(--radius-md)',
                      background: `linear-gradient(135deg, ${accentColor}18, rgba(255,255,255,0.03))`,
                      border: `1px solid ${accentColor}30`
                    }}
                  >
                    <input
                      ref={inputRef}
                      value={draftTitle}
                      onChange={e => setDraftTitle(e.target.value)}
                      onClick={e => e.stopPropagation()}
                      onKeyDown={async e => {
                        e.stopPropagation()

                        if (e.key === 'Enter') {
                          e.preventDefault()
                          await submitRename(chat)
                        }

                        if (e.key === 'Escape') {
                          e.preventDefault()
                          cancelRename()
                        }
                      }}
                      style={{
                        flex: 1,
                        minWidth: 0,
                        background: 'rgba(255,255,255,0.04)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        borderRadius: 8,
                        color: 'var(--text)',
                        padding: '8px 10px',
                        fontSize: 13,
                        outline: 'none'
                      }}
                    />

                    <button
                      aria-label="Save chat name"
                      title="Save"
                      onMouseDown={e => e.stopPropagation()}
                      onClick={async e => {
                        e.preventDefault()
                        e.stopPropagation()
                        await submitRename(chat)
                      }}
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: 8,
                        background: `linear-gradient(135deg, ${accentColor}24, ${accentColor}12)`,
                        border: `1px solid ${accentColor}35`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer'
                      }}
                    >
                      <CheckIcon color={accentColor} />
                    </button>

                    <button
                      aria-label="Cancel rename"
                      title="Cancel"
                      onMouseDown={e => e.stopPropagation()}
                      onClick={e => {
                        e.preventDefault()
                        e.stopPropagation()
                        cancelRename()
                      }}
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: 8,
                        background: 'rgba(255,255,255,0.045)',
                        border: '1px solid rgba(255,255,255,0.06)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer'
                      }}
                    >
                      <CloseIcon color="var(--text-faint)" />
                    </button>
                  </div>
                ) : (
                  <>
                    <button
                      onClick={() => onSelect(chat.id)}
                      style={{
                        width: '100%',
                        textAlign: 'left',
                        padding: '10px 74px 10px 10px',
                        background: active
                          ? `linear-gradient(135deg, ${accentColor}18, rgba(255,255,255,0.03))`
                          : hovered
                          ? 'rgba(255,255,255,0.035)'
                          : 'transparent',
                        border: `1px solid ${active ? accentColor + '30' : 'transparent'}`,
                        borderRadius: 'var(--radius-md)',
                        color: active ? 'var(--text)' : 'var(--text-muted)',
                        fontSize: 13,
                        transition: 'var(--transition)',
                        overflow: 'hidden',
                        whiteSpace: 'nowrap',
                        textOverflow: 'ellipsis',
                        cursor: 'pointer'
                      }}
                    >
                      {chat.title}
                    </button>

                    <div
                      style={{
                        position: 'absolute',
                        right: 8,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                        opacity: active || hovered ? 1 : 0,
                        pointerEvents: active || hovered ? 'auto' : 'none',
                        transition: 'opacity 140ms ease'
                      }}
                    >
                      <button
                        aria-label={`Rename ${chat.title}`}
                        title="Rename chat"
                        onMouseDown={e => e.stopPropagation()}
                        onClick={e => {
                          e.preventDefault()
                          e.stopPropagation()
                          beginRename(chat)
                        }}
                        style={{
                          width: 26,
                          height: 26,
                          borderRadius: 8,
                          background: 'rgba(255,255,255,0.045)',
                          border: '1px solid rgba(255,255,255,0.06)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'var(--text-faint)',
                          transition: 'var(--transition)',
                          cursor: 'pointer'
                        }}
                      >
                        <PencilIcon color={iconColor} />
                      </button>

                      <button
                        aria-label={`Delete ${chat.title}`}
                        title="Delete chat"
                        onMouseDown={e => e.stopPropagation()}
                        onClick={e => {
                          e.preventDefault()
                          e.stopPropagation()
                          onDelete(chat.id)
                        }}
                        style={{
                          width: 26,
                          height: 26,
                          borderRadius: 8,
                          background: 'rgba(255,255,255,0.045)',
                          border: '1px solid rgba(255,255,255,0.06)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'var(--text-faint)',
                          transition: 'var(--transition)',
                          cursor: 'pointer'
                        }}
                      >
                        <TrashIcon color={iconColor} />
                      </button>
                    </div>
                  </>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {!isWeb && (
        <div
          style={{
            padding: '10px 14px',
            borderTop: `1px solid var(--border)`,
            display: 'flex',
            alignItems: 'center',
            gap: 7
          }}
        >
          <div
            style={{
              width: 7,
              height: 7,
              borderRadius: '50%',
              background: ollamaOnline ? '#00c864' : '#ff6b6b',
              boxShadow: ollamaOnline ? '0 0 6px #00c86480' : '0 0 6px #ff6b6b80',
              animation: ollamaOnline ? 'pulse 2s ease-in-out infinite' : 'none'
            }}
          />
          <span style={{ fontSize: 12, color: 'var(--text-faint)' }}>
            Ollama {ollamaOnline ? 'Online' : 'Offline'}
          </span>
        </div>
      )}
    </div>
  )
}