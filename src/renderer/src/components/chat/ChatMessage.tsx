import React from 'react'
import type { UIMessage } from '../../types/ui'

interface Props {
  message: UIMessage
  accentColor: string
}

function formatTime(ts: number) {
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function renderContent(content: string) {
  let html = content
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre><code>$2</code></pre>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    .replace(/\n/g, '<br />')

  return html
}

export function ChatMessage({ message, accentColor }: Props) {
  const isUser = message.role === 'user'
  const pendingStyle = message.pending
    ? {
        opacity: 0.88,
        boxShadow: `0 0 0 1px ${accentColor}18 inset`
      }
    : null

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: isUser ? 'flex-end' : 'flex-start',
        marginBottom: 16,
        animation: 'fadeIn 0.2s ease-out',
        padding: '0 4px'
      }}
    >
      {!isUser && (
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: '50%',
            background: `linear-gradient(135deg, ${accentColor}40, ${accentColor}20)`,
            border: `1px solid ${accentColor}50`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 12,
            fontWeight: 700,
            color: accentColor,
            flexShrink: 0,
            marginRight: 10,
            marginTop: 2
          }}
        >
          C
        </div>
      )}

      <div style={{ maxWidth: '72%' }}>
        <div
          style={{
            padding: '10px 14px',
            borderRadius: isUser
              ? 'var(--radius-lg) var(--radius-lg) 4px var(--radius-lg)'
              : 'var(--radius-lg) var(--radius-lg) var(--radius-lg) 4px',
            background: isUser
              ? `linear-gradient(135deg, ${accentColor}25, ${accentColor}15)`
              : 'rgba(255,255,255,0.04)',
            border: `1px solid ${isUser ? accentColor + '30' : 'rgba(255,255,255,0.07)'}`,
            fontSize: 14,
            lineHeight: 1.6,
            color: 'var(--text)',
            wordBreak: 'break-word',
            ...pendingStyle
          }}
          dangerouslySetInnerHTML={{ __html: renderContent(message.content) }}
        />
        <div
          style={{
            fontSize: 11,
            color: 'var(--text-faint)',
            marginTop: 4,
            textAlign: isUser ? 'right' : 'left',
            paddingInline: 4
          }}
        >
          {formatTime(message.created_at)}
          {message.pending ? ' · sending' : ''}
        </div>
      </div>

      {isUser && (
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: '50%',
            background: `linear-gradient(135deg, ${accentColor}50, ${accentColor}30)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 11,
            fontWeight: 700,
            color: 'var(--text)',
            flexShrink: 0,
            marginLeft: 10,
            marginTop: 2
          }}
        >
          U
        </div>
      )}
    </div>
  )
}