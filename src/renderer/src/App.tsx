import React, { useState, useEffect, useMemo } from 'react'
import { ChatPage } from './pages/ChatPage'
import { SettingsPanel } from './components/settings/SettingsPanel'
import { useChatStore } from './store/chatStore'
import { useSettingsStore, persistSettings } from './store/settingsStore'
import { useModels } from './hooks/useModels'
import { useChat } from './hooks/useChat'
import type { AppMode } from './types/ui'

type LibraryModel = {
  name: string
  displayName: string
  uses: string[]
  sizeGb: string
  pull: string
}

const MODEL_LIBRARY: LibraryModel[] = [
  { name: 'llama3.1:8b', displayName: 'Llama 3.1 8B', uses: ['chat', 'research'], sizeGb: '4.7 GB', pull: 'llama3.1:8b' },
  { name: 'qwen2.5:7b', displayName: 'Qwen 2.5 7B', uses: ['chat', 'code'], sizeGb: '4.4 GB', pull: 'qwen2.5:7b' },
  { name: 'mistral:7b', displayName: 'Mistral 7B', uses: ['chat', 'research'], sizeGb: '4.1 GB', pull: 'mistral:7b' },
  { name: 'qwen2.5-coder:3b', displayName: 'Qwen 2.5 Coder 3B', uses: ['code'], sizeGb: '1.9 GB', pull: 'qwen2.5-coder:3b' },
  { name: 'qwen2.5-coder:7b', displayName: 'Qwen 2.5 Coder 7B', uses: ['code'], sizeGb: '4.7 GB', pull: 'qwen2.5-coder:7b' },
  { name: 'deepseek-r1:7b', displayName: 'DeepSeek R1 7B', uses: ['research', 'chat'], sizeGb: '4.7 GB', pull: 'deepseek-r1:7b' },
  { name: 'gemma3:4b', displayName: 'Gemma 3 4B', uses: ['design', 'chat'], sizeGb: '2.7 GB', pull: 'gemma3:4b' },
  { name: 'llama3.2:1b', displayName: 'Llama 3.2 1B', uses: ['chat', 'code'], sizeGb: '1.3 GB', pull: 'llama3.2:1b' },
  { name: 'llama3.2:3b', displayName: 'Llama 3.2 3B', uses: ['chat', 'code'], sizeGb: '2.0 GB', pull: 'llama3.2:3b' },
  { name: 'nomic-embed-text', displayName: 'Nomic Embed Text', uses: ['research'], sizeGb: '0.1 GB', pull: 'nomic-embed-text' }
]

function matchesInstalledModel(installedName: string, libraryModel: LibraryModel) {
  return (
    installedName === libraryModel.name ||
    installedName === libraryModel.pull ||
    installedName.startsWith(`${libraryModel.name}:`) ||
    installedName.startsWith(`${libraryModel.pull}:`) ||
    libraryModel.name.startsWith(`${installedName}:`) ||
    libraryModel.pull.startsWith(`${installedName}:`)
  )
}

export function App() {
  const [mode, setMode] = useState<AppMode>('local')
  const [transitioning, setTransitioning] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [showModelLibrary, setShowModelLibrary] = useState(false)
  const [ollamaOnline, setOllamaOnline] = useState(false)
  const [selectedModel, setSelectedModel] = useState('')
  const [installingModel, setInstallingModel] = useState<string | null>(null)
  const [installProgress, setInstallProgress] = useState<Record<string, number>>({})
  const [installedNames, setInstalledNames] = useState<string[]>([])
  const [deletingModel, setDeletingModel] = useState<string | null>(null)

  const { settings } = useSettingsStore()
  const {
    models,
    loading: modelsLoading,
    error: modelError,
    pullProgress,
    pullModel,
    deleteModel
  } = useModels()

  const {
    chats,
    activeChatId,
    messages,
    streamingContent,
    isStreaming,
    selectChat,
    deleteChat,
    renameChat,
    newChat
  } = useChatStore(mode)

  const { send } = useChat(mode, selectedModel)
  const accentColor = mode === 'web' ? '#3d8bff' : '#00c864'
  const installedSet = useMemo(() => new Set(installedNames), [installedNames])

  const selectableModels = useMemo(() => {
    if (!models.length) return []

    return models.filter(model => {
      const libraryEntry =
        MODEL_LIBRARY.find(item => item.name === model.name) ||
        MODEL_LIBRARY.find(item => item.pull === model.name)

      if (!libraryEntry) return true

      return (
        libraryEntry.uses.includes('chat') ||
        libraryEntry.uses.includes('code') ||
        libraryEntry.uses.includes('design')
      )
    })
  }, [models])

  useEffect(() => {
  if (models.length === 0) {
    if (selectedModel !== '') setSelectedModel('')
    return
  }

  const selectedStillExists = models.some(model => model.name === selectedModel)
  if (selectedModel && selectedStillExists) {
    return
  }

  const desired = mode === 'local' ? settings.localModel : settings.webModel
  const desiredExists = models.find(model => model.name === desired)?.name

  setSelectedModel(desiredExists || models[0].name)
}, [mode, models, settings.localModel, settings.webModel])

  useEffect(() => {
    if (!selectedModel) return

    if (mode === 'local' && settings.localModel !== selectedModel) {
      persistSettings({ localModel: selectedModel })
    }

    if (mode === 'web' && settings.webModel !== selectedModel) {
      persistSettings({ webModel: selectedModel })
    }
  }, [selectedModel, mode, settings.localModel, settings.webModel])

  useEffect(() => {
    const check = async () => {
      const res = await window.cronos.getStatus()
      if (res.success && res.data) setOllamaOnline(res.data.ollamaOnline)
    }

    check()
    const interval = setInterval(check, 10000)
    return () => clearInterval(interval)
  }, [])

  const switchMode = () => {
    if (transitioning) return

    setTransitioning(true)
    setTimeout(() => {
      setMode(prev => (prev === 'local' ? 'web' : 'local'))
      setTransitioning(false)
    }, 200)
  }

  const handleSend = (message: string, searchQuery?: string) => {
    if (mode === 'local' && !selectedModel) return
    send(message, activeChatId, searchQuery)
  }

  const handleModelChange = (model: string) => {
    setSelectedModel(model)
  }

  const handleSaveSettings = async (nextSettings: Parameters<typeof persistSettings>[0]) => {
    await persistSettings(nextSettings)
  }

  const handleInstallModel = async (model: LibraryModel) => {
    if (
      installedNames.some(name => matchesInstalledModel(name, model)) ||
      installingModel
    ) {
      return
    }

    setInstallingModel(model.pull)
    setInstallProgress(prev => ({ ...prev, [model.pull]: 0 }))

    try {
      await pullModel(model.pull)

      setInstallProgress(prev => ({ ...prev, [model.pull]: 100 }))

      const refreshed = await window.cronos.listModels()

      if (refreshed.success && Array.isArray(refreshed.data)) {
        const names = refreshed.data.map((m: { name: string }) => m.name)
        setInstalledNames(names)

        const isChatCapable =
          model.uses.includes('chat') ||
          model.uses.includes('code') ||
          model.uses.includes('design')

        if (isChatCapable) {
          const installedName =
            names.find(name => matchesInstalledModel(name, model)) || model.pull

          setSelectedModel(installedName)

          await persistSettings(
            mode === 'local'
              ? { localModel: installedName }
              : { webModel: installedName }
          )
        }
      } else {
        setInstalledNames(prev => Array.from(new Set([...prev, model.pull])))

        const isChatCapable =
          model.uses.includes('chat') ||
          model.uses.includes('code') ||
          model.uses.includes('design')

        if (isChatCapable) {
          setSelectedModel(model.pull)
          await persistSettings(
            mode === 'local'
              ? { localModel: model.pull }
              : { webModel: model.pull }
          )
        }
      }
    } catch (err) {
      setInstallProgress(prev => ({ ...prev, [model.pull]: 0 }))
      throw err
    } finally {
      setInstallingModel(null)
    }
  }

  const handleLibraryToggle = () => setShowModelLibrary(v => !v)

  const handleDeleteModel = async (model: LibraryModel) => {
    if (deletingModel || installingModel) return

    const installed = installedNames.some(name => matchesInstalledModel(name, model))
    if (!installed) return

    const ok = window.confirm(`Delete ${model.displayName}?`)
    if (!ok) return

    setDeletingModel(model.pull)

    try {
      await deleteModel(model.pull)

      const refreshed = await window.cronos.listModels()
      if (refreshed.success && Array.isArray(refreshed.data)) {
        const names = refreshed.data.map((m: { name: string }) => m.name)
        setInstalledNames(names)

        const stillSelectedInstalled = selectedModel
          ? names.includes(selectedModel)
          : false

        if (selectedModel && !stillSelectedInstalled) {
          setSelectedModel(names[0] || '')
        }
      } else {
        setInstalledNames(prev => prev.filter(name => !matchesInstalledModel(name, model)))

        if (selectedModel && matchesInstalledModel(selectedModel, model)) {
          setSelectedModel('')
        }
      }
    } finally {
      setDeletingModel(null)
    }
  }

  const modelsForSelector = selectableModels.length ? selectableModels : models

  return (
    <div
      data-mode={mode}
      style={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflow: 'hidden',
        opacity: transitioning ? 0 : 1,
        transition: 'opacity 0.2s ease'
      }}
    >
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: -1,
          background:
            mode === 'web'
              ? 'linear-gradient(135deg, #020818 0%, #050d2e 40%, #020a1f 100%)'
              : 'linear-gradient(135deg, #050a05 0%, #0a1a0e 40%, #051210 100%)',
          transition: 'background var(--transition-slow)'
        }}
      />

      <div
        style={{
          position: 'fixed',
          width: 600,
          height: 600,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${accentColor}08 0%, transparent 70%)`,
          top: -200,
          right: -100,
          zIndex: -1,
          transition: 'background var(--transition-slow)',
          pointerEvents: 'none'
        }}
      />

      <div
        className="glass"
        style={{
          height: 44,
          display: 'flex',
          alignItems: 'center',
          padding: '0 16px',
          gap: 12,
          flexShrink: 0,
          borderBottom: '1px solid var(--border)',
          WebkitAppRegion: 'drag' as React.CSSProperties['WebkitAppRegion']
        }}
      >
        <div style={{ width: 70 }} />

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            background: 'rgba(255,255,255,0.04)',
            borderRadius: 'var(--radius-full)',
            padding: '3px',
            border: '1px solid var(--border)',
            WebkitAppRegion: 'no-drag' as React.CSSProperties['WebkitAppRegion']
          }}
        >
          {(['local', 'web'] as AppMode[]).map(item => (
            <button
              key={item}
              onClick={() => item !== mode && switchMode()}
              style={{
                padding: '4px 14px',
                borderRadius: 'var(--radius-full)',
                background:
                  mode === item
                    ? item === 'web'
                      ? '#3d8bff20'
                      : '#00c86420'
                    : 'transparent',
                border: `1px solid ${
                  mode === item
                    ? item === 'web'
                      ? '#3d8bff40'
                      : '#00c86440'
                    : 'transparent'
                }`,
                color: mode === item ? accentColor : 'var(--text-faint)',
                fontSize: 12,
                fontWeight: 500,
                transition: 'var(--transition)'
              }}
            >
              {item === 'web' ? '🌐 Web Live' : '🤖 Local'}
            </button>
          ))}
        </div>

        <div style={{ flex: 1 }} />

        <button
          onClick={handleLibraryToggle}
          style={{
            background: 'none',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)',
            color: 'var(--text-faint)',
            padding: '4px 10px',
            fontSize: 13,
            WebkitAppRegion: 'no-drag' as React.CSSProperties['WebkitAppRegion'],
            transition: 'var(--transition)'
          }}
        >
          📚 Model Library
        </button>

        <button
          onClick={() => setShowSettings(true)}
          style={{
            background: 'none',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)',
            color: 'var(--text-faint)',
            padding: '4px 10px',
            fontSize: 13,
            WebkitAppRegion: 'no-drag' as React.CSSProperties['WebkitAppRegion'],
            transition: 'var(--transition)'
          }}
        >
          ⚙ Settings
        </button>
      </div>

      <ChatPage
        mode={mode}
        chats={chats}
        activeChatId={activeChatId}
        messages={messages}
        streamingContent={streamingContent}
        isStreaming={isStreaming}
        models={modelsForSelector}
        selectedModel={selectedModel}
        onModelChange={handleModelChange}
        onSelectChat={selectChat}
        onDeleteChat={deleteChat}
        onRenameChat={renameChat}
        onNewChat={newChat}
        onSend={handleSend}
        ollamaOnline={ollamaOnline}
        sendWithEnter={settings.sendWithEnter}
        modelsLoading={modelsLoading}
        modelError={modelError}
      />

      {showSettings && (
        <SettingsPanel
          settings={settings}
          onSave={handleSaveSettings}
          onClose={() => setShowSettings(false)}
          models={models}
          pullProgress={pullProgress}
          onPullModel={pullModel}
          onDeleteModel={deleteModel}
        />
      )}

      {showModelLibrary && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.35)',
            backdropFilter: 'blur(10px)',
            zIndex: 30
          }}
          onClick={() => setShowModelLibrary(false)}
        >
          <div
            onClick={e => e.stopPropagation()}
            className="glass-2"
            style={{
              position: 'absolute',
              left: 260,
              top: 72,
              width: 'min(860px, calc(100vw - 290px))',
              maxHeight: 'calc(100vh - 110px)',
              overflow: 'hidden',
              borderRadius: 'var(--radius-xl)',
              border: '1px solid var(--border)',
              boxShadow: 'var(--shadow-lg)',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '14px 16px',
                borderBottom: '1px solid var(--border)'
              }}
            >
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>
                  Model Library
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-faint)', marginTop: 2 }}>
                  Install models locally and they will appear in the chat selector.
                </div>
              </div>

              <button
                onClick={() => setShowModelLibrary(false)}
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 8,
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
                padding: 16,
                overflowY: 'auto',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                gap: 12
              }}
            >
              {MODEL_LIBRARY.map(model => {
                const installed = installedNames.some(name => matchesInstalledModel(name, model))
                const installing = installingModel === model.pull
                const deleting = deletingModel === model.pull

                const liveProgress = pullProgress[model.pull] ?? 0
                const finalProgress = installProgress[model.pull] ?? 0
                const progress = installing ? liveProgress : finalProgress

                return (
                  <div
                    key={model.pull}
                    style={{
                      borderRadius: 'var(--radius-lg)',
                      border: `1px solid ${installed ? accentColor + '35' : 'var(--border)'}`,
                      background: installed
                        ? `linear-gradient(135deg, ${accentColor}10, rgba(255,255,255,0.03))`
                        : 'rgba(255,255,255,0.035)',
                      padding: 14,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 10,
                      boxShadow: installed ? `0 0 0 1px ${accentColor}15 inset` : 'none'
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'start',
                        gap: 10
                      }}
                    >
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>
                          {model.displayName}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text-faint)', marginTop: 2 }}>
                          {model.sizeGb}
                        </div>
                      </div>

                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 600,
                          padding: '4px 8px',
                          borderRadius: 999,
                          color: installed ? accentColor : 'var(--text-faint)',
                          background: installed ? accentColor + '18' : 'rgba(255,255,255,0.04)',
                          border: `1px solid ${installed ? accentColor + '35' : 'var(--border)'}`
                        }}
                      >
                        {installed ? 'Installed' : 'Not installed'}
                      </span>
                    </div>

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {model.uses.map(use => (
                        <span
                          key={use}
                          style={{
                            fontSize: 11,
                            padding: '4px 7px',
                            borderRadius: 999,
                            background: 'rgba(255,255,255,0.04)',
                            color: 'var(--text-faint)',
                            border: '1px solid var(--border)',
                            textTransform: 'capitalize'
                          }}
                        >
                          {use}
                        </span>
                      ))}
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {!installed ? (
                        <button
                          onClick={() => handleInstallModel(model)}
                          disabled={installing || !!installingModel}
                          style={{
                            padding: '9px 12px',
                            borderRadius: 'var(--radius-md)',
                            background: installing
                              ? `linear-gradient(135deg, ${accentColor}22, ${accentColor}14)`
                              : `linear-gradient(135deg, ${accentColor}26, ${accentColor}16)`,
                            border: `1px solid ${accentColor}30`,
                            color: accentColor,
                            fontSize: 13,
                            fontWeight: 600,
                            cursor: installing || installingModel ? 'wait' : 'pointer'
                          }}
                        >
                          {installing ? `Installing ${progress}%` : 'Install'}
                        </button>
                      ) : (
                        <button
                          onClick={() => handleDeleteModel(model)}
                          disabled={deleting || !!deletingModel}
                          style={{
                            padding: '9px 12px',
                            borderRadius: 'var(--radius-md)',
                            background: deleting ? 'rgba(255,255,255,0.03)' : 'rgba(255,90,90,0.08)',
                            border: `1px solid ${deleting ? 'var(--border)' : 'rgba(255,90,90,0.25)'}`,
                            color: deleting ? 'var(--text-faint)' : '#ff8f8f',
                            fontSize: 13,
                            fontWeight: 600,
                            cursor: deleting || deletingModel ? 'wait' : 'pointer'
                          }}
                        >
                          {deleting ? 'Deleting...' : 'Delete'}
                        </button>
                      )}

                      {(installing || progress > 0) && !installed && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div
                            style={{
                              flex: 1,
                              height: 6,
                              borderRadius: 999,
                              background: 'rgba(255,255,255,0.05)',
                              overflow: 'hidden',
                              border: '1px solid var(--border)'
                            }}
                          >
                            <div
                              style={{
                                width: `${progress}%`,
                                height: '100%',
                                background: `linear-gradient(90deg, ${accentColor}, ${
                                  mode === 'web' ? '#8cc4ff' : '#59f0ac'
                                })`,
                                transition: 'width 160ms ease'
                              }}
                            />
                          </div>

                          <div
                            style={{
                              width: 34,
                              textAlign: 'right',
                              fontSize: 11,
                              color: 'var(--text-faint)',
                              fontVariantNumeric: 'tabular-nums'
                            }}
                          >
                            {progress}%
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}