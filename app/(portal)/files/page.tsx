'use client'
import { useEffect, useState } from 'react'
import { Plus, Download, Trash2, FolderOpen, Upload } from 'lucide-react'
import { IconButton } from '@/components/ui/IconButton'
import { Modal } from '@/components/ui/Modal'
import { PageSpinner } from '@/components/ui/Spinner'
import { Department, DeptFolder, DeptFile } from '@/types'
import { formatFileSize, formatDateTime } from '@/lib/utils'

export default function FilesPage() {
  const [departments, setDepartments] = useState<Department[]>([])
  const [folders, setFolders] = useState<DeptFolder[]>([])
  const [files, setFiles] = useState<DeptFile[]>([])
  const [selectedDept, setSelectedDept] = useState<number | null>(null)
  const [selectedFolder, setSelectedFolder] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [canDelete, setCanDelete] = useState(false)
  const [uploadOpen, setUploadOpen] = useState(false)
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [uploadTitle, setUploadTitle] = useState('')
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(me => {
      setCanDelete(me.role?.level >= 80)
    })
    fetch('/api/admin/departments').then(r => r.json()).then(data => {
      setDepartments(Array.isArray(data) ? data : [])
      setLoading(false)
    })
  }, [])

  useEffect(() => {
    if (!selectedDept) { setFolders([]); setFiles([]); return }
    fetch(`/api/admin/dept-folders?dept_id=${selectedDept}`).then(r => r.json()).then(data => {
      setFolders(Array.isArray(data) ? data : [])
      setSelectedFolder(null)
    })
  }, [selectedDept])

  useEffect(() => {
    if (!selectedFolder) { setFiles([]); return }
    fetch(`/api/files?folder_id=${selectedFolder}`).then(r => r.json()).then(data => {
      setFiles(Array.isArray(data) ? data : [])
    })
  }, [selectedFolder])

  const handleDownload = async (file: DeptFile) => {
    const res = await fetch(`/api/files/${file.id}`)
    const { url } = await res.json()
    if (url) window.open(url, '_blank')
  }

  const handleDelete = async (id: number) => {
    if (!confirm('削除しますか？')) return
    await fetch(`/api/files/${id}`, { method: 'DELETE' })
    setFiles(f => f.filter(x => x.id !== id))
  }

  const handleUpload = async () => {
    if (!uploadFile || !selectedFolder || !selectedDept) return
    setUploading(true)
    const fd = new FormData()
    fd.append('file', uploadFile)
    fd.append('title', uploadTitle || uploadFile.name)
    fd.append('folder_id', String(selectedFolder))
    fd.append('dept_id', String(selectedDept))
    const res = await fetch('/api/files', { method: 'POST', body: fd })
    if (res.ok) {
      const newFile = await res.json()
      setFiles(f => [newFile, ...f])
      setUploadOpen(false)
      setUploadFile(null)
      setUploadTitle('')
    }
    setUploading(false)
  }

  if (loading) return <PageSpinner />

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-gray-800">データ管理</h1>
        {selectedFolder && (
          <IconButton icon={<Upload size={18} />} label="アップロード" onClick={() => setUploadOpen(true)} />
        )}
      </div>

      {/* 部署選択 */}
      <div className="bg-white rounded-2xl shadow-sm p-4 mb-4">
        <p className="text-xs font-semibold text-gray-400 mb-2">部署を選択</p>
        <div className="flex flex-wrap gap-2">
          {departments.map(d => (
            <button
              key={d.id}
              onClick={() => setSelectedDept(d.id === selectedDept ? null : d.id)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                selectedDept === d.id ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {d.name}
            </button>
          ))}
        </div>
      </div>

      {/* フォルダ選択 */}
      {folders.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm p-4 mb-4">
          <p className="text-xs font-semibold text-gray-400 mb-2">フォルダ</p>
          <div className="flex flex-wrap gap-2">
            {folders.map(f => (
              <button
                key={f.id}
                onClick={() => setSelectedFolder(f.id === selectedFolder ? null : f.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  selectedFolder === f.id ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <FolderOpen size={14} /> {f.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ファイル一覧 */}
      {selectedFolder && (
        <div className="bg-white rounded-2xl shadow-sm divide-y">
          {files.length === 0 && (
            <p className="px-4 py-8 text-center text-gray-400 text-sm">ファイルはありません</p>
          )}
          {files.map(file => (
            <div key={file.id} className="flex items-center gap-3 px-4 py-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">{file.title}</p>
                <p className="text-xs text-gray-400">{formatFileSize(file.file_size)} · {formatDateTime(file.created_at)}</p>
              </div>
              <div className="flex gap-1.5">
                <IconButton icon={<Download size={14} />} label="ダウンロード" variant="secondary" size="sm" onClick={() => handleDownload(file)} />
                {canDelete && <IconButton icon={<Trash2 size={14} />} label="削除" variant="danger" size="sm" onClick={() => handleDelete(file.id)} />}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={uploadOpen} onClose={() => setUploadOpen(false)} title="ファイルアップロード" size="sm">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ファイル</label>
            <input
              type="file"
              onChange={e => setUploadFile(e.target.files?.[0] ?? null)}
              className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">タイトル（省略可）</label>
            <input
              className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              value={uploadTitle}
              onChange={e => setUploadTitle(e.target.value)}
              placeholder="ファイル名が使用されます"
            />
          </div>
          <div className="flex gap-2 pt-2">
            <button onClick={() => setUploadOpen(false)} className="flex-1 border rounded-xl py-2.5 text-sm text-gray-600 hover:bg-gray-50">キャンセル</button>
            <button onClick={handleUpload} disabled={!uploadFile || uploading} className="flex-1 bg-blue-600 text-white rounded-xl py-2.5 text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
              {uploading ? 'アップロード中...' : 'アップロード'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
