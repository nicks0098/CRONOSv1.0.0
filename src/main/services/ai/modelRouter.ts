// src/main/services/ai/modelRouter.ts
import { getSettings } from '../config/settings'

export function resolveModel(mode: 'local' | 'web', requestedModel?: string): string {
  const settings = getSettings()
  if (requestedModel) return requestedModel
  if (mode === 'web') return settings.webModel || settings.localModel || 'llama3'
  return settings.localModel || 'llama3'
}