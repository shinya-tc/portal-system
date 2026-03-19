'use client'
import { useEffect, useState } from 'react'
import { Plus, Trash2, ChevronLeft, ChevronRight } from 'lucide-react'
import { IconButton } from '@/components/ui/IconButton'
import { Modal } from '@/components/ui/Modal'
import { PageSpinner } from '@/components/ui/Spinner'
import { ShiftSubmission } from '@/types'
import { generateTimeOptions, toDateStr } from '@/lib/utils'

const DAYS = ['日', '月', '火', '水', '木', '金', '土']
const TIMES = generateTimeOptions()

export default function ShiftsPage() {
  const [shifts, setShifts] = useState<ShiftSubmission[]>([])
  const [loading, setLoading] = useState(true)
  const [month, setMonth] = useState(() => toDateStr(new Date()).slice(0, 7))
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState({ work_date: '', start_time: '09:00', end_time: '18:00', note: '' })
  const [saving, setSaving] = useState(false)

  useEffect(() => { loadShifts() }, [month])

  const loadShifts = () => {
    fetch(`/api/shifts?month=${month}`).then(r => r.json()).then(data => {
      setShifts(Array.isArray(data) ? data : [])
      setLoading(false)
    })
  }

  const changeMonth = (delta: number) => {
    const [y, m] = month.split('-').map(Number)
    const d = new Date(y, m - 1 + delta, 1)
    setMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
  }

  const handleSave = async () => {
    setSaving(true)
    await fetch('/api/shifts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    setModalOpen(false)
    loadShifts()
    setSaving(false)
  }

  const handleDelete = async (id: number) => {
    if (!confirm('削除しますか？')) return
    await fetch(`/api/shifts/${id}`, { method: 'DELETE' })
    setShifts(s => s.filter(x => x.id !== id))
  }

  const openAdd = (date?: string) => {
    setForm({ work_date: date ?? '', start_time: '09:00', end_time: '18:00', note: '' })
    setModalOpen(true)
  }

  // カレンダー生成
  const [year, mon] = month.split('-').map(Number)
  const firstDay = new Date(year, mon - 1, 1).getDay()
  const daysInMonth = new Date(year, mon, 0).getDate()
  const shiftMap = new Map(shifts.map(s => [s.work_date, s]))

  if (loading) return <PageSpinner />

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-gray-800">シフト提出</h1>
        <IconButton icon={<Plus size={20} />} label="追加" onClick={() => openAdd()} />
      </div>

      {/* 月ナビ */}
      <div className="flex items-center justify-between bg-white rounded-2xl shadow-sm px-4 py-3 mb-4">
        <button onClick={() => changeMonth(-1)} className="p-1.5 rounded-full hover:bg-gray-100">
          <ChevronLeft size={20} />
        </button>
        <span className="font-semibold text-gray-800">{year}年{mon}月</span>
        <button onClick={() => changeMonth(1)} className="p-1.5 rounded-full hover:bg-gray-100">
          <ChevronRight size={20} />
        </button>
      </div>

      {/* カレンダー */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden mb-4">
        <div className="grid grid-cols-7 border-b">
          {DAYS.map((d, i) => (
            <div key={d} className={`py-2 text-center text-xs font-medium ${i === 0 ? 'text-red-500' : i === 6 ? 'text-blue-500' : 'text-gray-500'}`}>{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {Array(firstDay).fill(null).map((_, i) => <div key={`e${i}`} className="h-16 border-r border-b" />)}
          {Array(daysInMonth).fill(null).map((_, i) => {
            const day = i + 1
            const dateStr = `${month}-${String(day).padStart(2, '0')}`
            const shift = shiftMap.get(dateStr)
            const dow = (firstDay + i) % 7
            const isToday = dateStr === toDateStr(new Date())
            return (
              <div
                key={day}
                onClick={() => openAdd(dateStr)}
                className={`h-16 border-r border-b p-1 cursor-pointer hover:bg-blue-50 transition-colors ${isToday ? 'bg-blue-50' : ''}`}
              >
                <div className={`text-xs font-medium mb-0.5 ${dow === 0 ? 'text-red-500' : dow === 6 ? 'text-blue-500' : 'text-gray-700'} ${isToday ? 'w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center' : ''}`}>
                  {day}
                </div>
                {shift && (
                  <div className="text-xs bg-green-100 text-green-700 rounded px-1 truncate leading-tight">
                    {shift.start_time.slice(0,5)}〜{shift.end_time.slice(0,5)}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* 一覧 */}
      <div className="bg-white rounded-2xl shadow-sm divide-y">
        <div className="px-4 py-3 flex items-center justify-between">
          <p className="text-sm font-semibold text-gray-600">提出済み ({shifts.length}件)</p>
        </div>
        {shifts.map(s => (
          <div key={s.id} className="flex items-center gap-3 px-4 py-3">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-800">{s.work_date}</p>
              <p className="text-sm text-gray-500">{s.start_time.slice(0,5)} 〜 {s.end_time.slice(0,5)}</p>
              {s.note && <p className="text-xs text-gray-400 mt-0.5">{s.note}</p>}
            </div>
            <IconButton icon={<Trash2 size={14} />} label="削除" variant="danger" size="sm" onClick={() => handleDelete(s.id)} />
          </div>
        ))}
        {shifts.length === 0 && (
          <p className="px-4 py-6 text-center text-sm text-gray-400">提出されたシフトはありません</p>
        )}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="シフト提出" size="sm">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">日付</label>
            <input type="date" className="w-full border rounded-xl px-3 py-2 text-sm" value={form.work_date} onChange={e => setForm(f => ({ ...f, work_date: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">開始時間</label>
              <select className="w-full border rounded-xl px-3 py-2 text-sm" value={form.start_time} onChange={e => setForm(f => ({ ...f, start_time: e.target.value }))}>
                {TIMES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">終了時間</label>
              <select className="w-full border rounded-xl px-3 py-2 text-sm" value={form.end_time} onChange={e => setForm(f => ({ ...f, end_time: e.target.value }))}>
                {TIMES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">メモ（任意）</label>
            <input className="w-full border rounded-xl px-3 py-2 text-sm" value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))} placeholder="備考など" />
          </div>
          <div className="flex gap-2 pt-2">
            <button onClick={() => setModalOpen(false)} className="flex-1 border rounded-xl py-2.5 text-sm text-gray-600">キャンセル</button>
            <button onClick={handleSave} disabled={!form.work_date || saving} className="flex-1 bg-blue-600 text-white rounded-xl py-2.5 text-sm font-medium disabled:opacity-50">
              {saving ? '保存中...' : '提出'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
