'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, CheckSquare, Calendar, ClipboardList, BookOpen } from 'lucide-react'
import { cn } from '@/lib/utils'

const nav = [
  { href: '/', label: 'ホーム', icon: Home },
  { href: '/checklists', label: 'チェック', icon: CheckSquare },
  { href: '/shifts', label: 'シフト', icon: Calendar },
  { href: '/tasks', label: 'タスク', icon: ClipboardList },
  { href: '/daily-reports', label: '日報', icon: BookOpen },
]

export function BottomNav() {
  const pathname = usePathname()
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t flex sm:hidden z-40">
      {nav.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || (href !== '/' && pathname.startsWith(href))
        return (
          <Link key={href} href={href} className="flex-1 flex flex-col items-center py-2 gap-0.5">
            <Icon size={20} className={active ? 'text-blue-600' : 'text-gray-400'} />
            <span className={cn('text-xs', active ? 'text-blue-600 font-medium' : 'text-gray-400')}>
              {label}
            </span>
          </Link>
        )
      })}
    </nav>
  )
}
