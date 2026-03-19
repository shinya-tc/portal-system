'use client'
import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { IconButton } from '@/components/ui/IconButton'
import { Modal } from '@/components/ui/Modal'
import { Badge } from '@/components/ui/Badge'
import { PageSpinner } from '@/components/ui/Spinner'
import { Profile, Role, Department } from '@/types'
import { ROLE_LABELS } from '@/lib/permissions'

const ROLE_COLORS: Record<string, 'red' | 'blue' | 'purple' | 'green' | 'gray'> = {
  admin: 'red', leader: 'blue', trainer: 'purple', staff: 'green', part_time: 'gray'
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<(Profile & { email: string })[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Profile | null>(null)
  const [form, setForm] = useState({ name: '', email: '', password: '', role_id: 1, department_ids: [] as number[], is_active: true })

  useEffect(() => {
    Promise.all([
      fetch('/api/admin/users').then(r => r.json()),
      fetch('/api/admin/departments').then(r => r.json()),
    ]).then(([userData, deptData]) => {
      setUsers(Array.isArray(userData) ? userData : [])
      setDepartments(Array.isArray(deptData) ? deptData : [])
      // ロールはユーザーから取得
      const roleSet = new Map<number, Role>()
      userData?.forEach((u: Profile) => { if (u.role) roleSet.set(u.role.id, u.role) })
      setRoles(Array.from(roleSet.values()).sort((a, b) => b.level - a.level))
      setLoading(false)
    })
  }, [])

  const openCreate = () => {
    setEditing(null)
    setForm({ name: '', email: '', password: '', role_id: roles.find(r => r.name === 'staff')?.id ?? 1, department_ids: [], is_active: true })
    setModalOpen(true)
  }

  const openEdit = (u: Profile & { email: string }) => {
    setEditing(u)
    const deptIds = u.user_departments?.map((ud: { department_id: number }) => ud.department_id) ?? []
    setForm({ name: u.name, email: u.email ?? '', password: '', role_id: u.role_id, department_ids: deptIds, is_active: u.is_active })
    setModalOpen(true)
  }

  const handleSave = async () => {
    if (editing) {
      await fetch(`/api/admin/users/${editing.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: form.name, role_id: form.role_id, department_ids: form.department_ids, is_active: form.is_active }),
      })
    } else {
      await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
    }
    setModalOpen(false)
    fetch('/api/admin/users').then(r => r.json()).then(data => setUsers(Array.isArray(data) ? data : []))
  }

  const handleDelete = async (id: string) => {
    if (!confirm('ユーザーを削除しますか？')) return
    await fetch(`/api/admin/users/${id}`, { method: 'DELETE' })
    setUsers(u => u.filter(x => x.id !== id))
  }

  const toggleDept = (id: number) => {
    setForm(f => ({
      ...f,
      department_ids: f.department_ids.includes(id)
        ? f.department_ids.filter(d => d !== id)
        : [...f.department_ids, id]
    }))
  }

  if (loading) return <PageSpinner />

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-gray-800">ユーザー管理</h1>
        <IconButton icon={<Plus size={20} />} label="追加" onClick={openCreate} />
      </div>

      <div className="bg-white rounded-2xl shadow-sm divide-y">
        {users.map(u => (
          <div key={u.id} className="flex items-center gap-3 px-4 py-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium text-gray-800">{u.name}</span>
                {u.role && <Badge label={ROLE_LABELS[u.role.name] ?? u.role.label} color={ROLE_COLORS[u.role.name] ?? 'gray'} />}
                {!u.is_active && <Badge label="無効" color="gray" />}
              </div>
              <p className="text-xs text-gray-400 mt-0.5">{u.email}</p>
              <div className="flex flex-wrap gap-1 mt-1">
                {u.user_departments?.map((ud: { department_id: number; department?: { name: string } }) => (
                  <span key={ud.department_id} className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">
                    {ud.department?.name}
                  </span>
                ))}
              </div>
            </div>
            <div className="flex gap-1.5">
              <IconButton icon={<Pencil size={14} />} variant="secondary" size="sm" onClick={() => openEdit(u)} />
              <IconButton icon={<Trash2 size={14} />} variant="danger" size="sm" onClick={() => handleDelete(u.id)} />
            </div>
          </div>
        ))}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'ユーザー編集' : 'ユーザー作成'}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">名前</label>
            <input className="w-full border rounded-xl px-3 py-2 text-sm" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
          </div>
          {!editing && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">メールアドレス</label>
                <input type="email" className="w-full border rounded-xl px-3 py-2 text-sm" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">パスワード</label>
                <input type="password" className="w-full border rounded-xl px-3 py-2 text-sm" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
              </div>
            </>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">役職</label>
            <select className="w-full border rounded-xl px-3 py-2 text-sm" value={form.role_id} onChange={e => setForm(f => ({ ...f, role_id: Number(e.target.value) }))}>
              {roles.map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">部署</label>
            <div className="flex flex-wrap gap-2">
              {departments.map(d => (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => toggleDept(d.id)}
                  className={`px-3 py-1.5 rounded-full text-sm transition-colors ${form.department_ids.includes(d.id) ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'}`}
                >
                  {d.name}
                </button>
              ))}
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
            <button onClick={handleSave} disabled={!form.name} className="flex-1 bg-blue-600 text-white rounded-xl py-2.5 text-sm font-medium disabled:opacity-50">保存</button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
