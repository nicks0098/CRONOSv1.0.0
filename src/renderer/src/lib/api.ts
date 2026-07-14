// src/renderer/src/lib/api.ts
export const api = {
  async sendMessage(payload: {
    chatId: string | null
    message: string
    model: string
    mode: 'local' | 'web'
    searchQuery?: string
  }) {
    return window.cronos.sendMessage(payload)
  },

  async listChats(mode?: string) {
    return window.cronos.listChats(mode)
  },

  async getMessages(chatId: string) {
    return window.cronos.getMessages(chatId)
  },

  async createChat(title: string, model: string, mode: 'local' | 'web') {
    return window.cronos.createChat(title, model, mode)
  },

  async deleteChat(chatId: string) {
    return window.cronos.deleteChat(chatId)
  },

  async renameChat(chatId: string, title: string) {
    return window.cronos.renameChat(chatId, title)
  },

  async listModels() {
    return window.cronos.listModels()
  },

  async pullModel(name: string) {
    return window.cronos.pullModel(name)
  },

  async deleteModel(name: string) {
    return window.cronos.deleteModel(name)
  },

  async getStatus() {
    return window.cronos.getStatus()
  },

  async ensureOllama() {
    return window.cronos.ensureOllama()
  },

  async getSettings() {
    return window.cronos.getSettings()
  },

  async saveSettings(settings: unknown) {
    return window.cronos.saveSettings(settings)
  },

  async searxngSearch(query: string) {
  return window.cronos.searxngSearch(query)
  },

async testSearxng(url: string) {
  return window.cronos.testSearxng(url)
  },

async openExternal(url: string) {
  return window.cronos.openExternal(url)
  },

  async dockerStatus() {
    return window.cronos.dockerStatus()
  },

  async startDockerHelp() {
    return window.cronos.startDockerHelp()
  },

  async openDockerSettings() {
    return window.cronos.openDockerSettings()
  },

  async startSearxngSetup() {
    return window.cronos.startSearxngSetup()
  },

  async testWebLive() {
    return window.cronos.testWebLive()
  },

  on(channel: string, cb: (...args: unknown[]) => void) {
    return window.cronos.on(channel, cb)
  },

  off(channel: string, cb: (...args: unknown[]) => void) {
    return window.cronos.off(channel, cb)
  },

  once(channel: string, cb: (...args: unknown[]) => void) {
    return window.cronos.once(channel, cb)
  }
}