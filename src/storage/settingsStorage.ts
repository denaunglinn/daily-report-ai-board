const KEY = 'settings'

export interface Settings {
  apiKey: string
}

export const settingsStorage = {
  save: (settings: Settings): Promise<void> =>
    chrome.storage.local.set({ [KEY]: settings }),

  load: (): Promise<Settings | null> =>
    chrome.storage.local.get(KEY).then(r => (r[KEY] as Settings) ?? null),

  clear: (): Promise<void> =>
    chrome.storage.local.remove(KEY),
}
