'use client'
import { useState } from 'react'
import { Menu, X } from 'lucide-react'
import { Sidebar } from './Sidebar'
import { SessionUser } from '@/types'

export function Header({ user }: { user: SessionUser }) {
  const [open, setOpen] = useState(false)

  return (
    <>
      {/* モバイルヘッダー */}
      <header className="sm:hidden fixed top-0 left-0 right-0 bg-white border-b z-40 flex items-center px-4 h-14">
        <button onClick={() => setOpen(true)} className="p-1.5 rounded-lg hover:bg-gray-100 mr-3">
          <Menu size={22} />
        </button>
        <h1 className="font-bold text-blue-600">社内ポータル</h1>
      </header>

      {/* モバイルドロワー */}
      {open && (
        <div className="sm:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <div className="relative w-64 h-full shadow-xl">
            <button
              onClick={() => setOpen(false)}
              className="absolute top-3 right-3 z-10 p-1.5 rounded-full bg-gray-100 hover:bg-gray-200"
            >
              <X size={18} />
            </button>
            <Sidebar user={user} onClose={() => setOpen(false)} />
          </div>
        </div>
      )}
    </>
  )
}
