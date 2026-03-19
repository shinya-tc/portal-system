'use client'
import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, X } from 'lucide-react'
import { IconButton } from '@/components/ui/IconButton'
import { Modal } from '@/components/ui/Modal'
import { Badge } from '@/components/ui/Badge'
import { PageSpinner } from '@/components/ui/Spinner'
import { ChecklistTemplate, Department } from '@/types'

const CYCLE_LABELS = { daily: '毎日', weekly: '曜日指定', monthly: '月指定日' }
const DAYS = ['日', '月', '火', '水', '木', '金', '土']

export default function AdminChecklistsPage() {
  const [templates, setTemplates] = useState<ChecklistTemplate[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<ChecklistTemplate | null>(null)
  const [form, setForm] = useState({
    title: '',
    department_id: '' as string | number,
    cycle_type: 'daily' as 'daily' | 'weekly' | 'monthly',
    cycle_days: [] as number[],
    items: [''] as string[],
    is_active: true,
  })

  useEffect(() => {
    Promise.all([
      fetch('/api/admin/checklist-templates').then(r => r.json()),
      fetch('/api/admin/departments').then(r => r.json()),
    ]).then(([t, d]) => {
      setTemplates(Array.isArray(t) ? t : [])
      setDepartments(Array.isArray(d) ? d : [])
      setLoading(false)
    })
  }, [])

  const openCreate = () => {
    setEditing(null)
    setForm({ title: '', department_id: '', cycle_type: 'daily', cycle_days: [], items: [''], is_active: true })
    setModalOpen(true)
  }

  const openEdit = (t: ChecklistTemplate) => {
    setEditing(t)
    setForm({
      title: t.title,
      department_id: t.department_id ?? '',
      cycle_type: t.cycle_type,
      cycle_days: t.cycle_days ?? [],
      items: t.items?.map(i => i.label) ?? [''],
      is_active: t.is_active,
    })
    setModalOpen(true)
  }

  const handleSave = async () => {
    const body = {
      ...form,
      department_id: form.department_id || null,
      items: form.items.filter(Boolean),
    }
    if (editing) {
      await fetch(`/api/admin/checklist-templates/${editing.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    } else {
      await fetch('/api/admin/checklist-templates', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    }
    setModalOpen(false)
    fetch('/api/admin/checklist-templates').then(r => r.json()).then(data => setTemplates(Array.isArray(data) ? data : []))
  }

  const handleDelete = async (id: number) => {
    if (!confirm('削除しますか？')) return
    await fetch(`/api/admin/checklist-templates/${id}`, { method: 'DELETE' })
    setTemplates(t => t.filter(x => x.id !== id))
  }

  const toggleDay = (day: number) => {
    setForm(f => ({ ...f, cycle_days: f.cycle_days.includes(day) ? f.cycle_days.filter(d => d !== day) : [...f.cycle_days, day] }))
  }

  if (loading) return <PageSpinner />

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-gray-800">チェックリスト管理</h1>
        <IconButton icon={<Plus size={20} />} label="追加" onClick={openCreate} />
      </div>

      <div className="space-y-3">
        {templates.map(t => (
          <div key={t.id} className="bg-white rounded-2xl shadow-sm p-4">
            <div className="flex items-start gap-2">
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-gray-800">{t.title}</span>
                  <Badge label={CYCLE_LABELS[t.cycle_type]} color="blue" />
                  {!t.is_active && <Badge label="無効" color="gray" />}
                  {t.department && <Badge label={t.department.name} color="green" />}
                </div>
                <p className="text-xs text-gray-400 mt-1">{t.items?.length ?? 0}項目</p>
              </div>
              <div className="flex gap-1.5">
                <IconButton icon={<Pencil size={14} />} variant="secondary" size="sm" onClick={() => openEdit(t)} />
                <IconButton icon={<Trash2 size={14} />} variant="danger" size="sm" onClick={() => handleDelete(t.id)} />
              </div>
            </div>
          </div>
        ))}
        {templates.length === 0 && <div className="bg-white rounded-2xl p-8 text-center text-gray-400">テンプレートがありません</div>}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'チェックリスト編集' : 'チェックリスト作成'} size="lg">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">タイトル</label>
            <input className="w-full border rounded-xl px-3 py-2 text-sm" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">対象部署（空=全体）</label>
            <select className="w-full border rounded-xl px-3 py-2 text-sm" value={form.department_id} onChange={e => setForm(f => ({ ...f, department_id: e.target.value }))}>
              <option value="">全体</option>
              {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">周期</label>
            <div className="flex gap-2">
              {(['daily', 'weekly', 'monthly'] as const).map(c => (
                <button key={c} type="button" onClick={() => setForm(f => ({ ...f, cycle_type: c, cycle_days: [] }))}
                  className={`flex-1 py-2 rounded-xl text-sm font-medium ${form.cycle_type === c ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'}`}>
                  {CYCLE_LABELS[c]}
                </button>
              ))}
            </div>
          </div>
          {form.cycle_type === 'weekly' && (
            <div className="flex gap-1.5">
              {DAYS.map((d, i) => (
                <button key={i} type="button" onClick={() => toggleDay(i)}
                  className={`flex-1 py-1.5 rounded-lg text-sm font-medium ${form.cycle_days.includes(i) ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'}`}>
                  {d}
                </button>
              ))}
            </div>
          )}
          {form.cycle_type === 'monthly' && (
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                <button key={day} type="button" onClick={() => toggleDay(day)}
                  className={`py-1 rounded-lg text-xs font-medium ${form.cycle_days.includes(day) ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'}`}>
                  {day}
                </button>
              ))}
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">チェック項目</label>
            <div className="space-y-2">
              {form.items.map((item, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    className="flex-1 border rounded-xl px-3 py-2 text-sm"
                    value={item}
                    placeholder={`項目 ${i + 1}`}
                    onChange={e => setForm(f => { const items = [...f.items]; items[i] = e.target.value; return { ...f, items } })}
                  />
                  {form.items.length > 1 && (
                    <button type="button" onClick={() => setForm(f => ({ ...f, items: f.items.filter((_, j) => j !== i) }))}>
                      <X size={16} className="text-gray-400" />
                    </button>
                  )}
                </div>
              ))}
              <button type="button" onClick={() => setForm(f => ({ ...f, items: [...f.items, ''] }))}
                className="text-sm text-blue-600 hover:underline">+ 項目を追加</button>
            </div>
          </div>
          {editing && (
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={form.is_active} onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))} />
              <span className="text-sm text-gray-700">有効</span>
            </label>
          )}
          <div className="flex gap-2 pt-2">
            <button onClick={() => setModalOpen(false)} className="flex-1 border rounded-xl py-2.5 text-sm text-gray-600">キャンセル</button>
            <button onClick={handleSave} disabled={!form.title} className="flex-1 bg-blue-600 text-white rounded-xl py-2.5 text-sm font-medium disabled:opacity-50">保存</button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
