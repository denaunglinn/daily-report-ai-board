import { useState, useEffect } from 'react'
import { settingsStorage, type Settings } from '@/storage/settingsStorage'

export function useSettings() {
  const [settings, setSettings] = useState<Settings | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    settingsStorage.load().then(s => {
      setSettings(s)
      setLoading(false)
    })
  }, [])

  async function saveSettings(apiKey: string): Promise<void> {
    const next = { apiKey }
    await settingsStorage.save(next)
    setSettings(next)
  }

  async function clearSettings(): Promise<void> {
    await settingsStorage.clear()
    setSettings(null)
  }

  return { settings, loading, saveSettings, clearSettings }
}
