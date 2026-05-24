import type { HistoryRecord, HistoryProjectStat } from '@/types'
import type { ParsedProject } from '@/types'

const KEY = 'history_records'
const MAX_AGE_DAYS = 90

export async function loadHistory(): Promise<HistoryRecord[]> {
  return new Promise(resolve => {
    chrome.storage.local.get(KEY, result => {
      resolve((result[KEY] as HistoryRecord[]) ?? [])
    })
  })
}

export async function appendHistory(
  fileName: string,
  projects: ParsedProject[],
): Promise<void> {
  const records = await loadHistory()
  const cutoff = Date.now() - MAX_AGE_DAYS * 24 * 60 * 60 * 1000
  const pruned = records.filter(r => new Date(r.generatedAt).getTime() > cutoff)

  const stats: HistoryProjectStat[] = projects.map(p => ({
    name: p.name,
    total: p.tasks.length,
    done: p.tasks.filter(t => t.status === '完了').length,
  }))

  const record: HistoryRecord = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    generatedAt: new Date().toISOString(),
    fileName,
    projects: stats,
  }

  await new Promise<void>(resolve => {
    chrome.storage.local.set({ [KEY]: [...pruned, record] }, resolve)
  })
}

export async function clearHistory(): Promise<void> {
  await new Promise<void>(resolve => {
    chrome.storage.local.remove(KEY, resolve)
  })
}
