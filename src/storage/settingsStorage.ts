const KEY = 'settings'

export interface ReportTemplate {
  greeting: string
  heading: string
  footer: string
}

export interface Settings {
  apiKey: string
  template: ReportTemplate
}

export const DEFAULT_TEMPLATE: ReportTemplate = {
  greeting: 'お疲れ様です。',
  heading: '本日の作業',
  footer: '',
}

export const settingsStorage = {
  save: (settings: Partial<Settings> & { template?: Partial<ReportTemplate> }): Promise<void> =>
    settingsStorage.load().then(current => {
      const merged: Settings = {
        apiKey: settings.apiKey ?? current?.apiKey ?? '',
        template: { ...DEFAULT_TEMPLATE, ...current?.template, ...settings.template },
      }
      return chrome.storage.local.set({ [KEY]: merged })
    }),

  load: (): Promise<Settings | null> =>
    chrome.storage.local.get(KEY).then(r => (r[KEY] as Settings) ?? null),

  clear: (): Promise<void> =>
    chrome.storage.local.remove(KEY),
}
