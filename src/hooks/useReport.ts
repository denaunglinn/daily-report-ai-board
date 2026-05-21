import { useState, useEffect } from 'react'
import type { Report } from '@/types'
import { reportStorage } from '@/storage/reportStorage'

export function useReport() {
  const [report, setReport] = useState<Report | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    reportStorage.load().then(saved => {
      setReport(saved)
      setLoading(false)
    })
  }, [])

  async function saveReport(file: File, imageDataUrl: string): Promise<Report> {
    const next: Report = {
      id: crypto.randomUUID(),
      fileName: file.name,
      imageDataUrl,
      capturedAt: new Date().toISOString(),
      rawText: null,
      status: 'pending',
      parsedBoard: null,
    }
    await reportStorage.save(next)
    setReport(next)
    return next
  }

  async function updateReport(patch: Partial<Report>): Promise<void> {
    if (!report) return
    const updated = { ...report, ...patch }
    await reportStorage.save(updated)
    setReport(updated)
  }

  async function clearReport(): Promise<void> {
    await reportStorage.clear()
    setReport(null)
  }

  return { report, loading, saveReport, updateReport, clearReport }
}
