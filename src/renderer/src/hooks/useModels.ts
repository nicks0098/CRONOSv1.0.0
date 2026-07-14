import { useState, useEffect } from 'react'
import type { UIModel } from '../types/ui'

type PullProgressEvent = {
  name: string
  completed?: number
  total?: number
  status?: string
  error?: string
}

export function useModels() {
  const [models, setModels] = useState<UIModel[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pullProgress, setPullProgress] = useState<Record<string, number>>({})

  const refresh = async () => {
    setLoading(true)
    setError(null)

    try {
      const res = await window.cronos.listModels()

      if (res.success) {
        const nextModels = Array.isArray(res.data) ? (res.data as UIModel[]) : []
        setModels(nextModels)
      } else {
        setModels([])
        setError(res.error || 'Failed to load models')
      }
    } catch (err) {
      setModels([])
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refresh()

    const onProgress = (...args: unknown[]) => {
      const data = args[0] as PullProgressEvent | undefined
      if (!data?.name) return

      if (data.error) {
        setPullProgress(prev => ({
          ...prev,
          [data.name]: 0
        }))
        return
      }

      if (
        typeof data.completed === 'number' &&
        typeof data.total === 'number' &&
        data.total > 0
      ) {
        const percent = Math.max(
          0,
          Math.min(100, Math.round((data.completed / data.total) * 100))
        )

        setPullProgress(prev => ({
          ...prev,
          [data.name]: percent
        }))
        return
      }

      if (data.status === 'success') {
        setPullProgress(prev => ({
          ...prev,
          [data.name]: 100
        }))
        return
      }

      if (data.status === 'starting') {
        setPullProgress(prev => ({
          ...prev,
          [data.name]: prev[data.name] ?? 0
        }))
      }
    }

    window.cronos.on('models:pull-progress', onProgress)

    return () => {
      window.cronos.off('models:pull-progress', onProgress)
    }
  }, [])

  const pullModel = async (name: string) => {
    setPullProgress(prev => ({ ...prev, [name]: 0 }))
    setError(null)

    try {
      const res = await window.cronos.pullModel(name)

      if (!res?.success) {
        throw new Error(res?.error || `Failed to pull model: ${name}`)
      }

      await refresh()

      setPullProgress(prev => ({
        ...prev,
        [name]: 100
      }))

      window.setTimeout(() => {
        setPullProgress(prev => {
          const next = { ...prev }
          delete next[name]
          return next
        })
      }, 1200)

      return res
    } catch (err) {
      setPullProgress(prev => ({
        ...prev,
        [name]: 0
      }))

      const message = err instanceof Error ? err.message : String(err)
      setError(message)
      throw err
    }
  }

  const deleteModel = async (name: string) => {
    setError(null)

    try {
      const res = await window.cronos.deleteModel(name)

      if (!res?.success) {
        throw new Error(res?.error || `Failed to delete model: ${name}`)
      }

      await refresh()
      return res
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      setError(message)
      throw err
    }
  }

  return {
    models,
    loading,
    error,
    pullProgress,
    refresh,
    pullModel,
    deleteModel
  }
}