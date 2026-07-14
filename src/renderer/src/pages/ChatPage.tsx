import React, { useMemo, useState } from 'react'
import type { AppMode, UIChat, UIMessage } from '../types/ui'
import { Sidebar } from '../components/sidebar/Sidebar'
import { Composer } from '../components/composer/Composer'

interface Props {
  mode: AppMode
  chats: UIChat[]
  activeChatId: string | null
  messages: UIMessage[]
  streamingContent: string
  isStreaming: boolean
  models: { name: string }[]
  selectedModel: string
  onModelChange: (model: string) => void
  onSelectChat: (chatId: string) => void
  onDeleteChat: (chatId: string) => void
  onRenameChat: (chatId: string, title: string) => void | Promise<void>
  onNewChat: () => void
  onSend: (message: string, searchQuery?: string) => void
  ollamaOnline: boolean
  sendWithEnter: boolean
  modelsLoading?: boolean
  modelError?: string | null
}

function formatTime(value?: number | string) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit'
  })
}

function EmptyState({ mode }: { mode: AppMode }) {
  return (
    <div
      style={{
        height: '100%',
        display: 'grid',
        placeItems: 'center',
        padding: 24
      }}
    >
      <div
        className="glass-2"
        style={{
          maxWidth: 520,
          width: '100%',
          borderRadius: 'var(--radius-xl)',
          border: '1px solid var(--border)',
          padding: '28px 24px',
          textAlign: 'center'
        }}
      >
        <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>
          {mode === 'web' ? 'No sessions yet' : 'No chats yet'}
        </div>
        <div style={{ fontSize: 13, color: 'var(--text-faint)', lineHeight: 1.7 }}>
          {mode === 'web'
            ? 'Start a new session and ask your first question.'
            : 'Start a new chat and ask CRONOS anything.'}
        </div>
      </div>
    </div>
  )
}

function TypingDots({ color }: { color: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '2px 0' }}>
      {[0, 1, 2].map(index => (
        <span
          key={index}
          style={{
            width: 7,
            height: 7,
            borderRadius: '50%',
            background: color,
            opacity: 0.35,
            animation: `cronosTyping 1.1s ease-in-out ${index * 0.16}s infinite`
          }}
        />
      ))}
    </div>
  )
}

function CopyButton({
  text,
  accent
}: {
  text: string
  accent: string
}) {
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1500)
    } catch {
      setCopied(false)
    }
  }

  return (
    <button
      onClick={copy}
      type="button"
      style={{
        border: `1px solid ${copied ? `${accent}55` : 'rgba(255,255,255,0.10)'}`,
        background: copied ? `${accent}18` : 'rgba(255,255,255,0.05)',
        color: copied ? accent : 'var(--text-muted)',
        fontSize: 11,
        fontWeight: 600,
        padding: '5px 9px',
        borderRadius: 10,
        transition: 'var(--transition)',
        cursor: 'pointer'
      }}
      title="Copy code"
    >
      {copied ? 'Copied' : 'Copy'}
    </button>
  )
}

function CodeBlock({
  code,
  language,
  accent
}: {
  code: string
  language?: string
  accent: string
}) {
  return (
    <div
      style={{
        marginTop: 10,
        marginBottom: 10,
        borderRadius: 14,
        overflow: 'hidden',
        border: '1px solid rgba(255,255,255,0.08)',
        background: '#0b0f14',
        boxShadow: '0 8px 24px rgba(0,0,0,0.22)'
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '9px 12px',
          background: 'rgba(255,255,255,0.04)',
          borderBottom: '1px solid rgba(255,255,255,0.06)'
        }}
      >
        <span
          style={{
            fontSize: 11,
            textTransform: 'lowercase',
            letterSpacing: 0.3,
            color: 'var(--text-faint)'
          }}
        >
          {language || 'code'}
        </span>
        <CopyButton text={code} accent={accent} />
      </div>

      <pre
        style={{
          margin: 0,
          padding: '14px 16px',
          overflowX: 'auto',
          fontSize: 12.5,
          lineHeight: 1.7,
          color: '#d7e2f0',
          fontFamily:
            'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace'
        }}
      >
        <code>{code}</code>
      </pre>
    </div>
  )
}

function InlineCode({ text }: { text: string }) {
  return (
    <code
      style={{
        padding: '2px 6px',
        borderRadius: 7,
        background: 'rgba(255,255,255,0.08)',
        border: '1px solid rgba(255,255,255,0.06)',
        fontSize: '0.92em',
        fontFamily:
          'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace'
      }}
    >
      {text}
    </code>
  )
}

function parseContent(content: string) {
  const blocks: Array<
    | { type: 'text'; content: string }
    | { type: 'code'; content: string; language?: string }
  > = []

  const regex = /```([\w-]+)?\n?([\s\S]*?)```/g
  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = regex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      blocks.push({
        type: 'text',
        content: content.slice(lastIndex, match.index)
      })
    }

    blocks.push({
      type: 'code',
      language: match[1]?.trim() || undefined,
      content: match[2].replace(/\n$/, '')
    })

    lastIndex = regex.lastIndex
  }

  if (lastIndex < content.length) {
    blocks.push({
      type: 'text',
      content: content.slice(lastIndex)
    })
  }

  return blocks
}

function renderTextWithInlineCode(text: string) {
  const parts = text.split(/(`[^`\n]+`)/g)

  return parts.map((part, index) => {
    if (part.startsWith('`') && part.endsWith('`') && part.length >= 2) {
      return <InlineCode key={index} text={part.slice(1, -1)} />
    }

    return (
      <React.Fragment key={index}>
        {part}
      </React.Fragment>
    )
  })
}

function MessageBody({
  content,
  accent
}: {
  content: string
  accent: string
}) {
  const blocks = useMemo(() => parseContent(content), [content])

  return (
    <div>
      {blocks.map((block, index) => {
        if (block.type === 'code') {
          return (
            <CodeBlock
              key={index}
              code={block.content}
              language={block.language}
              accent={accent}
            />
          )
        }

        const paragraphs = block.content
          .split(/\n{2,}/)
          .map(item => item.trim())
          .filter(Boolean)

        return (
          <div key={index}>
            {paragraphs.map((paragraph, pIndex) => (
              <p
                key={pIndex}
                style={{
                  margin: 0,
                  marginBottom: pIndex === paragraphs.length - 1 ? 0 : 10,
                  whiteSpace: 'pre-wrap'
                }}
              >
                {renderTextWithInlineCode(paragraph)}
              </p>
            ))}
          </div>
        )
      })}
    </div>
  )
}

function MessageBubble({
  message,
  mode
}: {
  message: UIMessage
  mode: AppMode
}) {
  const isUser = message.role === 'user'
  const accent = mode === 'web' ? '#3d8bff' : '#00c864'

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: isUser ? 'flex-end' : 'flex-start'
      }}
    >
      <div
        style={{
          width: 'min(78%, 860px)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: isUser ? 'flex-end' : 'flex-start'
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            marginBottom: 6,
            paddingInline: 4
          }}
        >
          <span
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: isUser ? accent : 'var(--text)'
            }}
          >
            {isUser ? 'You' : 'CRONOS'}
          </span>

          <span
            style={{
              fontSize: 11,
              color: 'var(--text-faint)'
            }}
          >
            {formatTime(message.created_at)}
          </span>
        </div>

        <div
          style={{
            width: '100%',
            borderRadius: 16,
            padding: '12px 14px',
            lineHeight: 1.7,
            fontSize: 14,
            color: 'var(--text)',
            border: isUser ? `1px solid ${accent}35` : '1px solid var(--border)',
            background: isUser
              ? `linear-gradient(135deg, ${accent}18, rgba(255,255,255,0.03))`
              : 'rgba(255,255,255,0.04)',
            boxShadow: isUser ? `0 0 0 1px ${accent}10 inset` : 'none',
            wordBreak: 'break-word'
          }}
        >
          <MessageBody content={message.content} accent={accent} />
        </div>
      </div>
    </div>
  )
}

function StreamingBubble({
  content,
  mode,
  isStreaming
}: {
  content: string
  mode: AppMode
  isStreaming: boolean
}) {
  const accent = mode === 'web' ? '#3d8bff' : '#00c864'

  return (
    <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
      <div
        style={{
          width: 'min(78%, 860px)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start'
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            marginBottom: 6,
            paddingInline: 4
          }}
        >
          <span
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: 'var(--text)'
            }}
          >
            CRONOS
          </span>
          <span
            style={{
              fontSize: 11,
              color: 'var(--text-faint)'
            }}
          >
            {formatTime(Date.now())}
          </span>
        </div>

        <div
          style={{
            width: '100%',
            borderRadius: 16,
            padding: '12px 14px',
            lineHeight: 1.7,
            fontSize: 14,
            color: 'var(--text)',
            border: '1px solid var(--border)',
            background: 'rgba(255,255,255,0.04)',
            wordBreak: 'break-word'
          }}
        >
          {content ? (
            <MessageBody content={content} accent={accent} />
          ) : (
            <TypingDots color={accent} />
          )}

          {isStreaming && content && (
            <span
              style={{
                display: 'inline-block',
                width: 8,
                marginLeft: 4,
                color: accent,
                opacity: 0.9,
                animation: 'cronosCaret 1s steps(1) infinite'
              }}
            >
              ▍
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

function MessageList({
  messages,
  streamingContent,
  mode,
  isStreaming
}: {
  messages: UIMessage[]
  streamingContent: string
  mode: AppMode
  isStreaming: boolean
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {messages.map(message => (
        <MessageBubble key={message.id} message={message} mode={mode} />
      ))}

      {isStreaming && (
        <StreamingBubble
          content={streamingContent}
          mode={mode}
          isStreaming={isStreaming}
        />
      )}
    </div>
  )
}

export function ChatPage(props: Props) {
  const {
    mode,
    chats,
    activeChatId,
    messages,
    streamingContent,
    isStreaming,
    models,
    selectedModel,
    onModelChange,
    onSelectChat,
    onDeleteChat,
    onRenameChat,
    onNewChat,
    onSend,
    ollamaOnline,
    sendWithEnter,
    modelsLoading,
    modelError
  } = props

  const activeChat = chats.find(chat => chat.id === activeChatId) || null
  const composerSelectedModel = mode === 'local' ? selectedModel : 'web-live'

  return (
    <main style={{ display: 'flex', flex: 1, minHeight: 0 }}>
      <style>
        {`
          @keyframes cronosTyping {
            0%, 80%, 100% { transform: translateY(0); opacity: .3; }
            40% { transform: translateY(-4px); opacity: 1; }
          }

          @keyframes cronosCaret {
            0%, 49% { opacity: 1; }
            50%, 100% { opacity: 0; }
          }
        `}
      </style>

      <Sidebar
        mode={mode}
        chats={chats}
        activeChatId={activeChatId}
        onSelect={onSelectChat}
        onDelete={onDeleteChat}
        onRename={onRenameChat}
        onNewChat={onNewChat}
        ollamaOnline={ollamaOnline}
      />

      <section
        style={{
          display: 'flex',
          flexDirection: 'column',
          flex: 1,
          minWidth: 0,
          minHeight: 0
        }}
      >
        <div
          style={{
            padding: '16px 18px 12px',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12
          }}
        >
          <div style={{ minWidth: 0 }}>
            <div
              style={{
                fontSize: 15,
                fontWeight: 700,
                color: 'var(--text)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}
            >
              {activeChat?.title || (mode === 'web' ? 'Web Live' : 'CRONOS')}
            </div>

            <div
              style={{
                marginTop: 4,
                fontSize: 12,
                color: 'var(--text-faint)'
              }}
            >
              {mode === 'web' ? 'Separate web workspace' : 'Private local workspace'}
            </div>
          </div>

          {mode === 'local' && (
            <div style={{ fontSize: 11, color: 'var(--text-faint)' }}>
              {selectedModel ? `Model: ${selectedModel}` : 'No model selected'}
            </div>
          )}
        </div>

        <div
          style={{
            flex: 1,
            minHeight: 0,
            overflowY: 'auto',
            padding: '18px 18px 8px'
          }}
        >
          {messages.length === 0 && !isStreaming && !streamingContent ? (
            <EmptyState mode={mode} />
          ) : (
            <MessageList
              messages={messages}
              streamingContent={streamingContent}
              mode={mode}
              isStreaming={isStreaming}
            />
          )}
        </div>

        <Composer
          onSend={onSend}
          isStreaming={isStreaming}
          mode={mode}
          models={mode === 'local' ? models : []}
          selectedModel={composerSelectedModel}
          onModelChange={onModelChange}
          sendWithEnter={sendWithEnter}
          modelsLoading={mode === 'local' ? modelsLoading : false}
          modelError={mode === 'local' ? modelError : null}
        />
      </section>
    </main>
  )
}