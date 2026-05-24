import { useState, useEffect, useCallback } from 'react'
import { settingsStorage, DEFAULT_TEMPLATE, type Settings, type ReportTemplate } from '@/storage/settingsStorage'

export function useSettings() {
  const [settings, setSettings] = useState<Settings | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    settingsStorage.load().then(s => {
      setSettings(s)
      setLoading(false)
    })
  }, [])

  const template: ReportTemplate = settings?.template ?? DEFAULT_TEMPLATE

  const saveTemplate = useCallback(async (t: ReportTemplate) => {
    await settingsStorage.save({ template: t })
    const updated = await settingsStorage.load()
    setSettings(updated)
  }, [])

  const resetTemplate = useCallback(async () => {
    await settingsStorage.save({ template: DEFAULT_TEMPLATE })
    const updated = await settingsStorage.load()
    setSettings(updated)
  }, [])

  return { settings, loading, template, saveTemplate, resetTemplate }
}
