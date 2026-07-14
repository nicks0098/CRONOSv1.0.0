import React from 'react'
import type { UIChat, AppMode } from '../../types/ui'

interface Props {
  chats: UIChat[]
  activeChatId: string | null
  onSelect: (id: string) => void
  onDelete: (id: string) => void
  accentColor: string
}

export function ConversationList({ chats, activeChatId, onSelect, onDelete, accentColor }: Props) {
  if (chats.length === 0) {
    return (
      <div style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--text-faint)', fontSize: 13 }}>
        No conversations yet.<br />Start a new chat.
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2, padding: '4px 8px' }}>
      {chats.map(chat => (
        <div
          key={chat.id}
          onClick={() => onSelect(chat.id)}
          style={{
            padding: '9px 10px',
            borderRadius: 'var(--radius-md)',
            cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 8,
            background: activeChatId === chat.id ? `${accentColor}15` : 'transparent',
            border: `1px solid ${activeChatId === chat.id ? accentColor + '25' : 'transparent'}`,
            transition: 'var(--transition)',
            animation: 'slideIn 0.2s ease-out',
            position: 'relative'
          }}
          onMouseEnter={e => {
            if (activeChatId !== chat.id) {
              (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)'
            }
          }}
          onMouseLeave={e => {
            if (activeChatId !== chat.id) {
              (e.currentTarget as HTMLElement).style.background = 'transparent'
            }
          }}
        >
          <span style={{ fontSize: 13, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            color: activeChatId === chat.id ? 'var(--text)' : 'var(--text-muted)' }}>
            {chat.title}
          </span>
          <button
            onClick={e => { e.stopPropagation(); onDelete(chat.id) }}
            style={{
              background: 'none', border: 'none', color: 'var(--text-faint)',
              fontSize: 14, padding: '2px 4px', borderRadius: 4,
              opacity: 0, transition: 'var(--transition)',
              cursor: 'pointer'
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.opacity = '1'; (e.currentTarget as HTMLElement).style.color = '#ff6b6b' }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.opacity = '0'; (e.currentTarget as HTMLElement).style.color = 'var(--text-faint)' }}
          >✕</button>
        </div>
      ))}
    </div>
  )
}
