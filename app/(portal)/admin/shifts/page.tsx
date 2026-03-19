'use client'
import { useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight, CheckCircle, Plus, Pencil } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { IconButton } from '@/components/ui/IconButton'
import { PageSpinner } from '@/components/ui/Spinner'
import { ShiftSubmission, PublishedShift, Profile, Department } from '@/types'
import { generateTimeOptions, toDateStr } from '@/lib/utils'

const TIMES = generateTimeOptions()
const DAYS = ['日', '月', '火', '水', '木', '金', '土']

export default function AdminShiftsPage() {
  const [tab, setTab] = useState<'submissions' | 'published'>('submissions')
  const [month, setMonth] = useState(() => toDateStr(new Date()).slice(0, 7))
  const [submissions, setSubmissions] = useState<ShiftSubmission[]>([])
  const [published, setPublished] = useState<PublishedShift[]>([])
  const [users, setUsers] = useState<Profile[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState({ user_id: '', work_date: '', start_time: '09:00', end_time: '18:00', department_id: '' })

  useEffect(() => { loadData() }, [month, tab])

  const loadData = () => {
    setLoading(true)
    Promise.all([
      fetch(`/api/admin/shifts?month=${month}&type=${tab}`).then(r => r.json()),
      fetch('/api/admin/users').then(r => r.json()),
      fetch('/api/admin/departments').then(r => r.json()),
    ]).then(([shiftData, userData, deptData]) => {
      if (tab === 'submissions') setSubmissions(Array.isArray(shiftData) ? shiftData : [])
      else setPublished(Array.isArray(shiftData) ? shiftData : [])
      setUsers(Array.isArray(userData) ? userData : [])
      setDepartments(Array.isArray(deptData) ? deptData : [])
      setLoading(false)
    })
  }

  const changeMonth = (delta: number) => {
    const [y, m] = month.split('-').map(Number)
    const d = new Date(y, m - 1 + delta, 1)
    setMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
  }

  const handlePublish = async (id: number) => {
    await fetch('/api/admin/shifts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'publish', shift_ids: [id] }),
    })
    setPublished(p => p.map(s => s.id === id ? { ...s, is_published: true } : s))
  }

  const handleCreateShift = async () => {
    await fetch('/api/admin/shifts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, department_id: form.department_id || null }),
    })
    setModalOpen(false)
    loadData()
  }

  const [year, mon] = month.split('-').map(Number)

  if (loading) return <PageSpinner />

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-800 mb-4">シフト管理</h1>

      {/* タブ */}
      <div className="flex bg-gray-100 rounded-xl p-1 mb-4">
        {(['submissions', 'published'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${tab === t ? 'bg-white shadow' : 'text-gray-500'}`}>
            {t === 'submissions' ? '提出シフト' : '仮シフト・公開'}
          </button>
        ))}
      </div>

      {/* 月ナビ */}
      <div className="flex items-center justify-between bg-white rounded-2xl shadow-sm px-4 py-3 mb-4">
        <button onClick={() => changeMonth(-1)} className="p-1.5 rounded-full hover:bg-gray-100"><ChevronLeft size={20} /></button>
        <span className="font-semibold text-gray-800">{year}年{mon}月</span>
        <button onClick={() => changeMonth(1)} className="p-1.5 rounded-full hover:bg-gray-100"><ChevronRight size={20} /></button>
      </div>

      {tab === 'submissions' ? (
        <div className="bg-white rounded-2xl shadow-sm divide-y">
          <div className="px-4 py-3 text-sm font-semibold text-gray-500">{submissions.length}件の提出</div>
          {submissions.map(s => (
            <div key={s.id} className="px-4 py-3">
              <div className="flex items-center gap-2">
                <span className="font-medium text-gray-800 text-sm">{(s.user as { name: string } | undefined)?.name}</span>
                <span className="text-xs text-gray-400">{s.work_date} ({DAYS[new Date(s.work_date).getDay()]})</span>
              </div>
              <p className="text-sm text-gray-600">{s.start_time.slice(0,5)} 〜 {s.end_time.slice(0,5)}</p>
              {s.note && <p className="text-xs text-gray-400">{s.note}</p>}
            </div>
          ))}
          {submissions.length === 0 && <p className="px-4 py-6 text-center text-sm text-gray-400">提出なし</p>}
        </div>
      ) : (
        <div>
          <div className="flex justify-end mb-3">
            <IconButton icon={<Plus size={18} />} label="仮シフト作成" onClick={() => { setForm({ user_id: '', work_date: '', start_time: '09:00', end_time: '18:00', department_id: '' }); setModalOpen(true) }} />
          </div>
          <div className="bg-white rounded-2xl shadow-sm divide-y">
            <div className="px-4 py-3 text-sm font-semibold text-gray-500">{published.length}件</div>
            {published.map(s => (
              <div key={s.id} className="flex items-center gap-3 px-4 py-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-800 text-sm">{(s.user as { name: string } | undefined)?.name}</span>
                    {s.is_published
                      ? <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full">公開済み</span>
                      : <span className="text-xs bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded-full">仮</span>
                    }
                  </div>
                  <p className="text-xs text-gray-400">{s.work_date} {s.start_time.slice(0,5)}〜{s.end_time.slice(0,5)}</p>
                </div>
                {!s.is_published && (
                  <button onClick={() => handlePublish(s.id)} className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded-full flex items-center gap-1 hover:bg-blue-700">
                    <CheckCircle size={14} /> 公開
                  </button>
                )}
              </div>
            ))}
            {published.length === 0 && <p className="px-4 py-6 text-center text-sm text-gray-400">仮シフトなし</p>}
          </div>
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="仮シフト作成" size="sm">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">スタッフ</label>
            <select className="w-full border rounded-xl px-3 py-2 text-sm" value={form.user_id} onChange={e => setForm(f => ({ ...f, user_id: e.target.value }))}>
              <option value="">選択してください</option>
              {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">日付</label>
            <input type="date" className="w-full border rounded-xl px-3 py-2 text-sm" value={form.work_date} onChange={e => setForm(f => ({ ...f, work_date: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">開始</label>
              <select className="w-full border rounded-xl px-3 py-2 text-sm" value={form.start_time} onChange={e => setForm(f => ({ ...f, start_time: e.target.value }))}>
                {TIMES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">終了</label>
              <select className="w-full border rounded-xl px-3 py-2 text-sm" value={form.end_time} onChange={e => setForm(f => ({ ...f, end_time: e.target.value }))}>
                {TIMES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">部署</label>
            <select className="w-full border rounded-xl px-3 py-2 text-sm" value={form.department_id} onChange={e => setForm(f => ({ ...f, department_id: e.target.value }))}>
              <option value="">未指定</option>
              {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>
          <div className="flex gap-2 pt-2">
            <button onClick={() => setModalOpen(false)} className="flex-1 border rounded-xl py-2.5 text-sm text-gray-600">キャンセル</button>
            <button onClick={handleCreateShift} disabled={!form.user_id || !form.work_date} className="flex-1 bg-blue-600 text-white rounded-xl py-2.5 text-sm font-medium disabled:opacity-50">作成</button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
