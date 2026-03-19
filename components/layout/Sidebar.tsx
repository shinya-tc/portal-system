'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Home, Megaphone, FolderOpen, CheckSquare, Calendar, ClipboardList, BookOpen,
  Users, Building2, ShieldCheck, Settings, LogOut, ChevronDown, ChevronRight
} from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import { SessionUser } from '@/types'
import { isAdmin, isLeaderOrAbove } from '@/lib/permissions'

interface NavItem {
  href: string
  label: string
  icon: React.ReactNode
  adminOnly?: boolean
  leaderOnly?: boolean
}

const mainNav: NavItem[] = [
  { href: '/', label: 'ホーム', icon: <Home size={20} /> },
  { href: '/announcements', label: 'お知らせ', icon: <Megaphone size={20} /> },
  { href: '/files', label: 'データ管理', icon: <FolderOpen size={20} /> },
  { href: '/checklists', label: 'チェックリスト', icon: <CheckSquare size={20} /> },
  { href: '/shifts', label: 'シフト提出', icon: <Calendar size={20} /> },
  { href: '/tasks', label: 'タスク管理', icon: <ClipboardList size={20} /> },
  { href: '/daily-reports', label: '日報', icon: <BookOpen size={20} /> },
]

const adminNav: NavItem[] = [
  { href: '/admin/users', label: 'ユーザー管理', icon: <Users size={20} /> },
  { href: '/admin/departments', label: '部署管理', icon: <Building2 size={20} /> },
  { href: '/admin/permissions', label: '権限管理', icon: <ShieldCheck size={20} /> },
  { href: '/admin/announcements', label: 'お知らせ管理', icon: <Megaphone size={20} /> },
  { href: '/admin/checklists', label: 'チェックリスト管理', icon: <Settings size={20} /> },
  { href: '/admin/shifts', label: 'シフト管理', icon: <Calendar size={20} /> },
]

interface Props {
  user: SessionUser
  onClose?: () => void
}

export function Sidebar({ user, onClose }: Props) {
  const pathname = usePathname()
  const [adminOpen, setAdminOpen] = useState(pathname.startsWith('/admin'))
  const showAdmin = isLeaderOrAbove(user)

  const NavLink = ({ item }: { item: NavItem }) => {
    const active = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))
    return (
      <Link
        href={item.href}
        onClick={onClose}
        className={cn(
          'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors',
          active
            ? 'bg-blue-600 text-white'
            : 'text-gray-600 hover:bg-gray-100'
        )}
      >
        {item.icon}
        {item.label}
      </Link>
    )
  }

  return (
    <div className="flex flex-col h-full bg-white border-r w-64 p-4">
      {/* ロゴ */}
      <div className="mb-6 px-1">
        <h1 className="text-xl font-bold text-blue-600">社内ポータル</h1>
        <p className="text-xs text-gray-400 mt-0.5">{user.name} ({user.role.label})</p>
      </div>

      {/* メインナビ */}
      <nav className="flex-1 space-y-1">
        {mainNav.map(item => <NavLink key={item.href} item={item} />)}

        {/* 管理メニュー */}
        {showAdmin && (
          <div className="mt-4">
            <button
              onClick={() => setAdminOpen(o => !o)}
              className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider hover:text-gray-600"
            >
              管理メニュー
              {adminOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </button>
            {adminOpen && (
              <div className="mt-1 space-y-1">
                {adminNav
                  .filter(item => !item.adminOnly || isAdmin(user))
                  .map(item => <NavLink key={item.href} item={item} />)
                }
              </div>
            )}
          </div>
        )}
      </nav>

      {/* ログアウト */}
      <form action="/api/auth/logout" method="POST">
        <button
          type="submit"
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-500 hover:bg-gray-100 transition-colors"
        >
          <LogOut size={20} />
          ログアウト
        </button>
      </form>
    </div>
  )
}
