import { useState } from 'react'
import type { HistoryRecord } from '@/types'
import type { PinnedReport } from '@/storage/pinnedStorage'
import './HistoryView.css'

interface Props {
  records: HistoryRecord[]
  pinned: PinnedReport[]
  onClose: () => void
  onClear: () => void
  onUnpin: (id: string) => void
  onClearPinned: () => void
}

// ── Date helpers ───────────────────────────────────────────────────────────────

function startOf(unit: 'day' | 'week' | 'month'): number {
  const now = new Date()
  if (unit === 'day') return new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
  if (unit === 'week') {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    d.setDate(d.getDate() - ((d.getDay() + 6) % 7)) // Monday start
    return d.getTime()
  }
  return new Date(now.getFullYear(), now.getMonth(), 1).getTime()
}

function filterRecords(records: HistoryRecord[], since: number): HistoryRecord[] {
  return records.filter(r => new Date(r.generatedAt).getTime() >= since)
}

function aggregateDone(records: HistoryRecord[]): { total: number; done: number } {
  let total = 0, done = 0
  for (const r of records) for (const p of r.projects) { total += p.total; done += p.done }
  return { total, done }
}

function formatTime(iso: string): string {
  const d = new Date(iso)
  return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

// ── Weekly chart ───────────────────────────────────────────────────────────────

const DAY_LABELS = ['月', '火', '水', '木', '金', '土', '日']

function getWeekDays(): Date[] {
  const now = new Date()
  const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  monday.setDate(monday.getDate() - ((now.getDay() + 6) % 7))
  return DAY_LABELS.map((_, i) => { const d = new Date(monday); d.setDate(d.getDate() + i); return d })
}

function recordsForDay(records: HistoryRecord[], date: Date): HistoryRecord[] {
  const start = date.getTime()
  const end   = start + 86400000 - 1
  return records.filter(r => { const t = new Date(r.generatedAt).getTime(); return t >= start && t <= end })
}

function WeeklyChart({ records }: { records: HistoryRecord[] }) {
  const days  = getWeekDays()
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  return (
    <div className="week-chart">
      <p className="week-chart__label">今週の推移</p>
      <div className="week-chart__bars">
        {days.map((d, i) => {
          const { done, total } = aggregateDone(recordsForDay(records, d))
          const pct    = total > 0 ? Math.round((done / total) * 100) : 0
          const isToday = d.getTime() === today.getTime()
          const isFuture = d.getTime() > today.getTime()
          return (
            <div key={i} className={`week-bar${isToday ? ' week-bar--today' : ''}`}>
              <span className="week-bar__pct">{total > 0 ? `${pct}%` : ''}</span>
              <div className="week-bar__track">
                <div
                  className={`week-bar__fill${isFuture ? ' week-bar__fill--future' : ''}`}
                  style={{ height: `${pct}%` }}
                />
              </div>
              <span className="week-bar__day">{DAY_LABELS[i]}</span>
              <span className="week-bar__score">{total > 0 ? `${done}/${total}` : '–'}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── CSV export ─────────────────────────────────────────────────────────────────

function exportCsv(records: HistoryRecord[]) {
  const rows = ['﻿日付,時刻,プロジェクト,完了,合計'] // BOM for Excel
  for (const r of [...records].sort((a, b) => a.generatedAt.localeCompare(b.generatedAt))) {
    const d    = new Date(r.generatedAt)
    const date = `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`
    const time = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
    for (const p of r.projects) {
      rows.push(`${date},${time},"${p.name.replace(/"/g, '""')}",${p.done},${p.total}`)
    }
  }
  const blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8;' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = `daily-report-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

// ── Pinned section ─────────────────────────────────────────────────────────────

function PinnedSection({ pinned, onUnpin, onClearPinned }: {
  pinned: PinnedReport[]
  onUnpin: (id: string) => void
  onClearPinned: () => void
}) {
  const [copiedId, setCopiedId] = useState<string | null>(null)

  async function handleCopy(p: PinnedReport) {
    await navigator.clipboard.writeText(p.text)
    setCopiedId(p.id)
    setTimeout(() => setCopiedId(null), 1600)
  }

  return (
    <div className="hist-section">
      <div className="hist-section__head">
        <span className="hist-section__label">📌 ブックマーク</span>
        <span style={{ flex: 1 }} />
        {pinned.length > 0 && (
          <button className="hist__clear-btn" onClick={onClearPinned} title="すべて削除">🗑</button>
        )}
      </div>
      {pinned.length === 0 ? (
        <p className="hist-empty">ブックマークなし</p>
      ) : (
        <div className="hist-cards">
          {pinned.map(p => (
            <div key={p.id} className="pin-card">
              <div className="pin-card__top">
                <span className="hist-card__time">{formatTime(p.pinnedAt)}</span>
                <div className="pin-card__actions">
                  <button
                    className="pin-card__btn"
                    onClick={() => handleCopy(p)}
                    title="コピー"
                  >{copiedId === p.id ? '✓' : '📋'}</button>
                  <button
                    className="pin-card__btn pin-card__btn--del"
                    onClick={() => onUnpin(p.id)}
                    title="削除"
                  >✕</button>
                </div>
              </div>
              <pre className="pin-card__text">{p.text.slice(0, 120)}{p.text.length > 120 ? '…' : ''}</pre>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── History section ────────────────────────────────────────────────────────────

function Section({ label, records }: { label: string; records: HistoryRecord[] }) {
  const { total, done } = aggregateDone(records)
  const pct = total > 0 ? Math.round((done / total) * 100) : 0

  return (
    <div className="hist-section">
      <div className="hist-section__head">
        <span className="hist-section__label">{label}</span>
        <span className="hist-section__agg">
          <span className="hist-agg-done">{done}</span>
          <span className="hist-agg-sep">/</span>
          <span className="hist-agg-total">{total}</span>
          <span className="hist-agg-unit">完了</span>
        </span>
        <div className="hist-section__bar">
          <div className="hist-section__bar-fill" style={{ width: `${pct}%` }} />
        </div>
        <span className="hist-section__pct">{pct}%</span>
      </div>

      {records.length === 0 ? (
        <p className="hist-empty">記録なし</p>
      ) : (
        <div className="hist-cards">
          {[...records].reverse().map(r => {
            const rdone  = r.projects.reduce((s, p) => s + p.done, 0)
            const rtotal = r.projects.reduce((s, p) => s + p.total, 0)
            return (
              <div key={r.id} className="hist-card">
                <div className="hist-card__top">
                  <span className="hist-card__time">{formatTime(r.generatedAt)}</span>
                  <span className="hist-card__score">{rdone}/{rtotal}</span>
                </div>
                <ul className="hist-card__projects">
                  {r.projects.map(p => (
                    <li key={p.name} className="hist-card__project">
                      <span className="hist-card__proj-name">● {p.name}</span>
                      <span className="hist-card__proj-stat">{p.done}/{p.total}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ── Main export ────────────────────────────────────────────────────────────────

export function HistoryView({ records, pinned, onClose, onClear, onUnpin, onClearPinned }: Props) {
  const today = filterRecords(records, startOf('day'))
  const week  = filterRecords(records, startOf('week'))
  const month = filterRecords(records, startOf('month'))

  return (
    <div className="hist">
      <div className="hist__topbar">
        <button className="hist__back" onClick={onClose}>← ボード</button>
        <span className="hist__title">履歴</span>
        <button
          className="hist__csv-btn"
          onClick={() => exportCsv(records)}
          title="CSVエクスポート"
          disabled={records.length === 0}
        >⬇ CSV</button>
        <button className="hist__clear-btn" onClick={onClear} title="履歴をすべて削除">🗑</button>
      </div>

      <div className="hist__body">
        <WeeklyChart records={records} />
        <PinnedSection pinned={pinned} onUnpin={onUnpin} onClearPinned={onClearPinned} />
        <Section label="今日" records={today} />
        <Section label="今週" records={week} />
        <Section label="今月" records={month} />
      </div>
    </div>
  )
}
