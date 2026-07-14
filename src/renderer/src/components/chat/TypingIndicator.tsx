import React from 'react'

export function TypingIndicator() {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 5,
      padding: '10px 0', opacity: 0.7
    }}>
      {[0, 1, 2].map(i => (
        <span key={i} style={{
          width: 6, height: 6, borderRadius: '50%',
          background: 'var(--accent)',
          animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite`
        }} />
      ))}
    </div>
  )
}
