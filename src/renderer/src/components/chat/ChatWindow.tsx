import React, { useEffect, useRef } from 'react'
import { ChatMessage } from './ChatMessage'
import { TypingIndicator } from './TypingIndicator'
import type { UIMessage, AppMode } from '../../types/ui'

interface Props {
  messages: UIMessage[]
  streamingContent: string
  isStreaming: boolean
  mode: AppMode
}

export function ChatWindow({ messages, streamingContent, isStreaming, mode }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null)
  const accentColor = mode === 'web' ? '#3d8bff' : '#00c864'

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamingContent])

  const isEmpty = messages.length === 0 && !isStreaming

  return (
    <div style={{
      flex: 1,
      overflowY: 'auto',
      padding: '20px 24px',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {isEmpty ? (
        <div style={{
          flex: 1, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          color: 'var(--text-faint)', textAlign: 'center',
          animation: 'fadeIn 0.4s ease-out'
        }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🤖</div>
          <div style={{ fontSize: 20, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 8 }}>
            {mode === 'web' ? 'CRONOS Web Live' : 'CRONOS'}
          </div>
          <div style={{ fontSize: 14, color: 'var(--text-faint)', maxWidth: 320 }}>
            {mode === 'web'
              ? 'Research-powered AI with live internet access'
              : 'Local AI assistant. Private, fast, and offline.'}
          </div>
        </div>
      ) : (
        <>
          {messages.map(msg => (
            msg.streaming ? (
              <div key={msg.id} style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: 16, animation: 'fadeIn 0.2s ease-out' }}>
                <div style={{
                  width: 28, height: 28, borderRadius: '50%',
                  background: `linear-gradient(135deg, ${accentColor}40, ${accentColor}20)`,
                  border: `1px solid ${accentColor}50`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 12, fontWeight: 700, color: accentColor,
                  flexShrink: 0, marginRight: 10, marginTop: 2
                }}>C</div>
                <div style={{
                  maxWidth: '72%', padding: '10px 14px',
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.07)',
                  borderRadius: 'var(--radius-lg) var(--radius-lg) var(--radius-lg) 4px',
                  fontSize: 14, lineHeight: 1.6, color: 'var(--text)',
                  whiteSpace: 'pre-wrap'
                }}>
                  {msg.content || streamingContent || <TypingIndicator />}
                  {isStreaming && (
                    <span style={{
                      display: 'inline-block', width: 2, height: 14,
                      background: accentColor, marginLeft: 2, verticalAlign: 'middle',
                      animation: 'blink 0.8s ease-in-out infinite'
                    }} />
                  )}
                </div>
              </div>
            ) : (
              <ChatMessage key={msg.id} message={msg} accentColor={accentColor} />
            )
          ))}
          {isStreaming && !messages.some(m => m.streaming) && streamingContent === '' && <TypingIndicator />}
        </>
      )}
      <div ref={bottomRef} />
    </div>
  )
}