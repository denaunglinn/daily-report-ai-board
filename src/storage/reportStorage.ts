import type { Report } from '@/types'

const KEY = 'current_report'

export const reportStorage = {
  save: (report: Report): Promise<void> =>
    chrome.storage.local.set({ [KEY]: report }),

  load: (): Promise<Report | null> =>
    chrome.storage.local.get(KEY).then(r => (r[KEY] as Report) ?? null),

  clear: (): Promise<void> =>
    chrome.storage.local.remove(KEY),
}
