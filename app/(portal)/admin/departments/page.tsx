'use client'
import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { IconButton } from '@/components/ui/IconButton'
import { Modal } from '@/components/ui/Modal'
import { PageSpinner } from '@/components/ui/Spinner'
import { Department } from '@/types'

export default function AdminDepartmentsPage() {
  const [departments, setDepartments] = useState<Department[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Department | null>(null)
  const [name, setName] = useState('')

  useEffect(() => { load() }, [])

  const load = () => {
    fetch('/api/admin/departments').then(r => r.json()).then(data => {
      setDepartments(Array.isArray(data) ? data : [])
      setLoading(false)
    })
  }

  const openCreate = () => { setEditing(null); setName(''); setModalOpen(true) }
  const openEdit = (d: Department) => { setEditing(d); setName(d.name); setModalOpen(true) }

  const handleSave = async () => {
    if (editing) {
      await fetch(`/api/admin/departments/${editing.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name }) })
    } else {
      await fetch('/api/admin/departments', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name }) })
    }
    setModalOpen(false)
    load()
  }

  const handleDelete = async (id: number) => {
    if (!confirm('部署を削除しますか？')) return
    await fetch(`/api/admin/departments/${id}`, { method: 'DELETE' })
    setDepartments(d => d.filter(x => x.id !== id))
  }

  if (loading) return <PageSpinner />

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-gray-800">部署管理</h1>
        <IconButton icon={<Plus size={20} />} label="追加" onClick={openCreate} />
      </div>

      <div className="bg-white rounded-2xl shadow-sm divide-y">
        {departments.map(d => (
          <div key={d.id} className="flex items-center gap-3 px-4 py-3">
            <span className="flex-1 font-medium text-gray-800">{d.name}</span>
            <div className="flex gap-1.5">
              <IconButton icon={<Pencil size={14} />} variant="secondary" size="sm" onClick={() => openEdit(d)} />
              <IconButton icon={<Trash2 size={14} />} variant="danger" size="sm" onClick={() => handleDelete(d.id)} />
            </div>
          </div>
        ))}
        {departments.length === 0 && (
          <p className="px-4 py-6 text-center text-sm text-gray-400">部署がありません</p>
        )}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? '部署編集' : '部署追加'} size="sm">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">部署名</label>
            <input className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" value={name} onChange={e => setName(e.target.value)} />
          </div>
          <div className="flex gap-2">
            <button onClick={() => setModalOpen(false)} className="flex-1 border rounded-xl py-2.5 text-sm text-gray-600">キャンセル</button>
            <button onClick={handleSave} disabled={!name} className="flex-1 bg-blue-600 text-white rounded-xl py-2.5 text-sm font-medium disabled:opacity-50">保存</button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
