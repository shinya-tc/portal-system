'use client'
import { useEffect, useState } from 'react'
import { PageSpinner } from '@/components/ui/Spinner'

interface FeaturePermission { id: number; feature_key: string; feature_label: string; category: string; min_role_level: number }
interface Role { id: number; name: string; label: string; level: number }

export default function AdminPermissionsPage() {
  const [features, setFeatures] = useState<FeaturePermission[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/permissions').then(r => r.json()).then(data => {
      setFeatures(data.features ?? [])
      setRoles(data.roles ?? [])
      setLoading(false)
    })
  }, [])

  const handleLevelChange = async (feature_key: string, min_role_level: number) => {
    setFeatures(f => f.map(x => x.feature_key === feature_key ? { ...x, min_role_level } : x))
    await fetch('/api/admin/permissions', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'feature', feature_key, min_role_level }),
    })
  }

  if (loading) return <PageSpinner />

  // カテゴリごとにグループ化
  const categories = Array.from(new Set(features.map(f => f.category)))

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-800 mb-4">権限管理</h1>
      <p className="text-sm text-gray-500 mb-4">各機能に対して必要な最低役職レベルを設定します。</p>

      <div className="space-y-6">
        {categories.map(cat => (
          <div key={cat}>
            <h2 className="text-sm font-semibold text-gray-400 mb-2 uppercase tracking-wide">{cat}</h2>
            <div className="bg-white rounded-2xl shadow-sm divide-y">
              {features.filter(f => f.category === cat).map(f => (
                <div key={f.feature_key} className="px-4 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-medium text-gray-800">{f.feature_label}</span>
                    <select
                      value={f.min_role_level}
                      onChange={e => handleLevelChange(f.feature_key, Number(e.target.value))}
                      className="border rounded-lg px-2 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
                    >
                      {roles.map(r => (
                        <option key={r.id} value={r.level}>{r.label}以上</option>
                      ))}
                    </select>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
