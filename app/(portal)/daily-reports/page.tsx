'use client'
import { useEffect, useState } from 'react'
import { Plus, ChevronLeft, ChevronRight, Copy, Check } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { PageSpinner } from '@/components/ui/Spinner'
import { DailyReport } from '@/types'

const TODAY = new Date().toISOString().slice(0, 10)

const emptyForm = {
  report_date: TODAY,
  tasks_done: '',
  tasks_ongoing: '',
  tasks_planned: '',
  handover: '特になし',
  issues: '',
  sharing: '特になし',
  questions: '特になし',
}

function formatReport(r: DailyReport, name: string) {
  const [, m, d] = r.report_date.split('-')
  return `【日付】${parseInt(m)}/${parseInt(d)}
【名前】${name}

■ 本日行った業務
${r.tasks_done}

■ 進行中のタスク
${r.tasks_ongoing}

■ 行いたい業務（今後やること）
${r.tasks_planned}

■ 引き継ぎ内容
${r.handover}

■ 問題点・気づき / 改善案
${r.issues}

■ 全体共有内容
${r.sharing}

■ 質問 / サポート依頼
${r.questions}`
}

export default function DailyReportsPage() {
  const [reports, setReports] = useState<DailyReport[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [editId, setEditId] = useState<number | null>(null)
  const [copied, setCopied] = useState<number | null>(null)
  const [userName, setUserName] = useState('河野')
  const [page, setPage] = useState(0)
  const PER_PAGE = 5

  useEffect(() => { loadReports() }, [])

  const loadReports = () => {
    fetch('/api/daily-reports').then(r => r.json()).then(data => {
      setReports(Array.isArray(data) ? data : [])
      setLoading(false)
    })
  }

  const openNew = () => {
    setEditId(null)
    setForm({ ...emptyForm, report_date: TODAY })
    setModalOpen(true)
  }

  const openEdit = (r: DailyReport) => {
    setEditId(r.id)
    setForm({
      report_date: r.report_date,
      tasks_done: r.tasks_done,
      tasks_ongoing: r.tasks_ongoing,
      tasks_planned: r.tasks_planned,
      handover: r.handover,
      issues: r.issues,
      sharing: r.sharing,
      questions: r.questions,
    })
    setModalOpen(true)
  }

  const handleSave = async () => {
    setSaving(true)
    await fetch('/api/daily-reports', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    setModalOpen(false)
    setSaving(false)
    loadReports()
  }

  const handleCopy = (r: DailyReport) => {
    navigator.clipboard.writeText(formatReport(r, userName))
    setCopied(r.id)
    setTimeout(() => setCopied(null), 2000)
  }

  const paged = reports.slice(page * PER_PAGE, (page + 1) * PER_PAGE)

  const Field = ({ label, field, rows = 3, placeholder = '' }: { label: string; field: keyof typeof form; rows?: number; placeholder?: string }) => (
    <div>
      <label className="block text-xs font-semibold text-gray-500 mb-1">{label}</label>
      <textarea
        rows={rows}
        className="w-full border rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-300"
        value={form[field]}
        onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))}
        placeholder={placeholder}
      />
    </div>
  )

  if (loading) return <PageSpinner />

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-gray-800">日報</h1>
        <button onClick={openNew} className="flex items-center gap-1.5 bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors">
          <Plus size={16} /> 今日の日報
        </button>
      </div>

      {/* 日報一覧 */}
      <div className="space-y-3">
        {reports.length === 0 && (
          <div className="bg-white rounded-2xl shadow-sm px-4 py-10 text-center text-sm text-gray-400">
            日報はまだありません
          </div>
        )}
        {paged.map(r => {
          const [, m, d] = r.report_date.split('-')
          return (
            <div key={r.id} className="bg-white rounded-2xl shadow-sm px-4 py-4">
              <div className="flex items-center justify-between mb-3">
                <span className="font-semibold text-gray-800">{parseInt(m)}/{parseInt(d)}（{userName}）</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleCopy(r)}
                    className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg border text-gray-500 hover:border-blue-400 hover:text-blue-600 transition-colors"
                  >
                    {copied === r.id ? <><Check size={12} className="text-green-500" /> コピー済み</> : <><Copy size={12} /> コピー</>}
                  </button>
                  <button
                    onClick={() => openEdit(r)}
                    className="text-xs px-3 py-1.5 rounded-lg border text-gray-500 hover:border-blue-400 hover:text-blue-600 transition-colors"
                  >
                    編集
                  </button>
                </div>
              </div>

              <div className="space-y-2 text-sm">
                {r.tasks_done && (
                  <div>
                    <p className="text-xs font-semibold text-gray-400 mb-0.5">■ 本日行った業務</p>
                    <p className="text-gray-700 whitespace-pre-wrap text-xs leading-relaxed">{r.tasks_done}</p>
                  </div>
                )}
                {r.tasks_ongoing && (
                  <div>
                    <p className="text-xs font-semibold text-gray-400 mb-0.5">■ 進行中のタスク</p>
                    <p className="text-gray-700 whitespace-pre-wrap text-xs leading-relaxed">{r.tasks_ongoing}</p>
                  </div>
                )}
                {r.issues && (
                  <div>
                    <p className="text-xs font-semibold text-gray-400 mb-0.5">■ 問題点・気づき / 改善案</p>
                    <p className="text-gray-700 whitespace-pre-wrap text-xs leading-relaxed">{r.issues}</p>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* ページング */}
      {reports.length > PER_PAGE && (
        <div className="flex items-center justify-center gap-4 mt-4">
          <button onClick={() => setPage(p => p - 1)} disabled={page === 0} className="p-1.5 rounded-full hover:bg-gray-100 disabled:opacity-30">
            <ChevronLeft size={18} />
          </button>
          <span className="text-sm text-gray-500">{page + 1} / {Math.ceil(reports.length / PER_PAGE)}</span>
          <button onClick={() => setPage(p => p + 1)} disabled={(page + 1) * PER_PAGE >= reports.length} className="p-1.5 rounded-full hover:bg-gray-100 disabled:opacity-30">
            <ChevronRight size={18} />
          </button>
        </div>
      )}

      {/* 作成・編集モーダル */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editId ? '日報を編集' : '日報を作成'} size="lg">
        <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-1">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">日付</label>
              <input type="date" className="w-full border rounded-xl px-3 py-2 text-sm" value={form.report_date} onChange={e => setForm(f => ({ ...f, report_date: e.target.value }))} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">名前</label>
              <input className="w-full border rounded-xl px-3 py-2 text-sm" value={userName} onChange={e => setUserName(e.target.value)} />
            </div>
          </div>

          <Field label="■ 本日行った業務" field="tasks_done" rows={4} placeholder="・タスク名 1h&#10;・タスク名 0.5h" />
          <Field label="■ 進行中のタスク" field="tasks_ongoing" rows={3} placeholder="・タスク名" />
          <Field label="■ 行いたい業務（今後やること）" field="tasks_planned" rows={3} placeholder="・タスク名" />
          <Field label="■ 引き継ぎ内容" field="handover" rows={2} />
          <Field label="■ 問題点・気づき / 改善案" field="issues" rows={4} placeholder="気づいたことや改善点を書いてください" />
          <Field label="■ 全体共有内容" field="sharing" rows={2} />
          <Field label="■ 質問 / サポート依頼" field="questions" rows={2} />

          <div className="flex gap-2 pt-1 sticky bottom-0 bg-white pb-1">
            <button onClick={() => setModalOpen(false)} className="flex-1 border rounded-xl py-2.5 text-sm text-gray-600">キャンセル</button>
            <button onClick={handleSave} disabled={!form.tasks_done || saving} className="flex-1 bg-blue-600 text-white rounded-xl py-2.5 text-sm font-medium disabled:opacity-50">
              {saving ? '保存中...' : '保存'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
