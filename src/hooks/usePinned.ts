import { useState, useEffect, useCallback } from 'react'
import type { PinnedReport } from '@/storage/pinnedStorage'
import { loadPinned, addPinned, removePinned, clearPinned as storeClear } from '@/storage/pinnedStorage'

export function usePinned() {
  const [pinned, setPinned] = useState<PinnedReport[]>([])

  useEffect(() => { loadPinned().then(setPinned) }, [])

  const pin = useCallback(async (text: string) => {
    const updated = await addPinned(text)
    setPinned(updated)
  }, [])

  const unpin = useCallback(async (id: string) => {
    const updated = await removePinned(id)
    setPinned(updated)
  }, [])

  const clearAll = useCallback(async () => {
    await storeClear()
    setPinned([])
  }, [])

  const isPinned = useCallback((text: string) => pinned.some(p => p.text === text), [pinned])

  return { pinned, pin, unpin, clearAll, isPinned }
}
