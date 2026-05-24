import { useState, useEffect, useCallback } from 'react'
import type { HistoryRecord } from '@/types'
import type { ParsedProject } from '@/types'
import { loadHistory, appendHistory, clearHistory as storeClear } from '@/storage/historyStorage'

export function useHistory() {
  const [records, setRecords] = useState<HistoryRecord[]>([])

  useEffect(() => {
    loadHistory().then(setRecords)
  }, [])

  const addRecord = useCallback(async (fileName: string, projects: ParsedProject[]) => {
    await appendHistory(fileName, projects)
    const updated = await loadHistory()
    setRecords(updated)
  }, [])

  const clearAll = useCallback(async () => {
    await storeClear()
    setRecords([])
  }, [])

  return { records, addRecord, clearAll }
}
