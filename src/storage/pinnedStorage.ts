export interface PinnedReport {
  id: string
  pinnedAt: string
  text: string
}

const KEY = 'pinned_reports'
const MAX = 20

export async function loadPinned(): Promise<PinnedReport[]> {
  return new Promise(resolve => {
    chrome.storage.local.get(KEY, result => {
      resolve((result[KEY] as PinnedReport[]) ?? [])
    })
  })
}

export async function addPinned(text: string): Promise<PinnedReport[]> {
  const list = await loadPinned()
  if (list.some(p => p.text === text)) return list
  const record: PinnedReport = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    pinnedAt: new Date().toISOString(),
    text,
  }
  const updated = [record, ...list].slice(0, MAX)
  await new Promise<void>(resolve => chrome.storage.local.set({ [KEY]: updated }, resolve))
  return updated
}

export async function removePinned(id: string): Promise<PinnedReport[]> {
  const list = await loadPinned()
  const updated = list.filter(p => p.id !== id)
  await new Promise<void>(resolve => chrome.storage.local.set({ [KEY]: updated }, resolve))
  return updated
}

export async function clearPinned(): Promise<void> {
  await new Promise<void>(resolve => chrome.storage.local.remove(KEY, resolve))
}
