// src/renderer/src/pages/WebLiveSetupPage.tsx
import React, { useEffect, useMemo, useState } from 'react'
import { api } from '../lib/api'

type Step = 'welcome' | 'docker-missing' | 'docker-stopped' | 'searxng' | 'test' | 'success'

type WebLiveStatus = {
  dockerInstalled: boolean
  dockerRunning: boolean
  searxngRunning: boolean
  webLiveConnected: boolean
  message?: string
}

const emptyStatus: WebLiveStatus = {
  dockerInstalled: false,
  dockerRunning: false,
  searxngRunning: false,
  webLiveConnected: false,
  message: 'Not checked yet.'
}

function getStepFromStatus(status: WebLiveStatus): Step {
  if (!status.dockerInstalled) return 'docker-missing'
  if (!status.dockerRunning) return 'docker-stopped'
  if (!status.searxngRunning) return 'searxng'
  if (!status.webLiveConnected) return 'test'
  return 'success'
}

function StatusRow({ label, value }: { label: string; value: boolean }) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '10px 12px',
        border: '1px solid #2a2f45',
        borderRadius: 10,
        background: '#12172a'
      }}
    >
      <span>{label}</span>
      <strong style={{ color: value ? '#65d6a6' : '#f3b35d' }}>{value ? 'Ready' : 'Waiting'}</strong>
    </div>
  )
}

export default function WebLiveSetupPage() {
  const [step, setStep] = useState<Step>('welcome')
  const [status, setStatus] = useState<WebLiveStatus>(emptyStatus)
  const [loading, setLoading] = useState(false)
  const [info, setInfo] = useState('')
  const [settingsGuide, setSettingsGuide] = useState<string[]>([])

  const statusItems = useMemo(
    () => [
      { label: 'Docker installed', value: status.dockerInstalled },
      { label: 'Docker running', value: status.dockerRunning },
      { label: 'SearXNG running', value: status.searxngRunning },
      { label: 'Web Live connected', value: status.webLiveConnected }
    ],
    [status]
  )

  const refreshStatus = async () => {
    setLoading(true)
    setInfo('Checking your system...')
    try {
      const res = await api.dockerStatus()
      const next = (res?.data ?? emptyStatus) as WebLiveStatus
      setStatus(next)
      setInfo(next.message ?? 'Status updated.')
      setStep(getStepFromStatus(next))
    } catch {
      setInfo('Could not check your Web Live status.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const handleSettings = (payload: unknown) => {
      const data = payload as { steps?: string[] } | undefined
      setSettingsGuide(data?.steps ?? [])
      setInfo('Docker settings guide opened below.')
    }

    const handleSearxng = () => {
      setInfo('Run your Docker SearXNG setup now, then click “I already set it up”.')
    }

    api.on('web-live:open-settings-guide', handleSettings)
    api.on('web-live:setup-searxng', handleSearxng)

    return () => {
      api.off('web-live:open-settings-guide', handleSettings)
      api.off('web-live:setup-searxng', handleSearxng)
    }
  }, [])

  const handleOpenDockerHelp = async () => {
    await api.startDockerHelp()
    setInfo('Docker download page opened.')
  }

  const handleOpenDockerSettings = async () => {
    await api.openDockerSettings()
  }

  const handleStartSearxngSetup = async () => {
    await api.startSearxngSetup()
  }

  const handleTestConnection = async () => {
    setLoading(true)
    setInfo('Testing Web Live connection...')
    try {
      const res = await api.testWebLive()
      const connected = !!res?.data?.connected
      const nextStatus = (res?.data?.status ?? status) as WebLiveStatus
      setStatus(nextStatus)
      if (connected) {
        setInfo('Web Live is ready to use.')
        setStep('success')
      } else {
        setInfo(nextStatus.message ?? 'Connection test failed. Check SearXNG and try again.')
        setStep(getStepFromStatus(nextStatus))
      }
    } catch {
      setInfo('The Web Live test failed.')
    } finally {
      setLoading(false)
    }
  }

  const renderActions = () => {
    switch (step) {
      case 'welcome':
        return <button onClick={refreshStatus} disabled={loading}>Start setup</button>
      case 'docker-missing':
        return (
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <button onClick={handleOpenDockerHelp} disabled={loading}>Download Docker Desktop</button>
            <button onClick={refreshStatus} disabled={loading}>Check again</button>
          </div>
        )
      case 'docker-stopped':
        return (
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <button onClick={handleOpenDockerSettings} disabled={loading}>Open Docker settings guide</button>
            <button onClick={refreshStatus} disabled={loading}>I opened Docker</button>
          </div>
        )
      case 'searxng':
        return (
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <button onClick={handleStartSearxngSetup} disabled={loading}>Auto setup SearXNG</button>
            <button onClick={refreshStatus} disabled={loading}>I already set it up</button>
          </div>
        )
      case 'test':
        return (
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <button onClick={handleTestConnection} disabled={loading}>Test Web Live</button>
            <button onClick={refreshStatus} disabled={loading}>Refresh status</button>
          </div>
        )
      case 'success':
        return <button onClick={refreshStatus} disabled={loading}>Run status check again</button>
    }
  }

  const stepTitle = {
    welcome: 'Web Live Advanced',
    'docker-missing': 'Docker Desktop needed',
    'docker-stopped': 'Start Docker Desktop',
    searxng: 'Set up SearXNG',
    test: 'Test Web Live',
    success: 'Setup complete'
  }[step]

  const stepBody = {
    welcome: 'This guided setup checks Docker, confirms SearXNG, and verifies your Web Live connection.',
    'docker-missing': 'Web Live Advanced needs Docker Desktop installed before local web search can work.',
    'docker-stopped': 'Docker Desktop is installed, but it is not running yet. Start it, then come back here.',
    searxng: 'Docker is ready. Next, make sure the SearXNG container is running on your machine.',
    test: 'Everything important is in place. Run a connection test to confirm Web Live is reachable.',
    success: 'Your machine is ready for Web Live Advanced.'
  }[step]

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#0b1020',
        color: '#e8ecff',
        padding: 24,
        fontFamily: 'Inter, system-ui, sans-serif'
      }}
    >
      <div
        style={{
          maxWidth: 920,
          margin: '0 auto',
          display: 'grid',
          gap: 20
        }}
      >
        <div
          style={{
            background: '#11162a',
            border: '1px solid #27304a',
            borderRadius: 16,
            padding: 24,
            display: 'grid',
            gap: 14
          }}
        >
          <div>
            <div style={{ color: '#8da2d9', fontSize: 13, marginBottom: 8 }}>CRONOS • Web Live Advanced</div>
            <h1 style={{ margin: 0, fontSize: 32 }}>{stepTitle}</h1>
          </div>
          <p style={{ margin: 0, color: '#b8c1de', lineHeight: 1.6 }}>{stepBody}</p>
          <div>{renderActions()}</div>
          <div style={{ color: '#9fb0df', fontSize: 14 }}>{loading ? 'Working...' : info || status.message}</div>
        </div>

        <div
          style={{
            background: '#11162a',
            border: '1px solid #27304a',
            borderRadius: 16,
            padding: 24,
            display: 'grid',
            gap: 12
          }}
        >
          <h2 style={{ margin: 0, fontSize: 20 }}>System status</h2>
          {statusItems.map((item) => (
            <StatusRow key={item.label} label={item.label} value={item.value} />
          ))}
        </div>

        {settingsGuide.length > 0 && (
          <div
            style={{
              background: '#11162a',
              border: '1px solid #27304a',
              borderRadius: 16,
              padding: 24,
              display: 'grid',
              gap: 12
            }}
          >
            <h2 style={{ margin: 0, fontSize: 20 }}>Docker settings guide</h2>
            <ol style={{ margin: 0, paddingLeft: 18, color: '#b8c1de', lineHeight: 1.7 }}>
              {settingsGuide.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ol>
          </div>
        )}
      </div>
    </div>
  )
}