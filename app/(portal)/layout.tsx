import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Sidebar } from '@/components/layout/Sidebar'
import { Header } from '@/components/layout/Header'
import { BottomNav } from '@/components/layout/BottomNav'
import { SessionUser } from '@/types'

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*, role:roles(*), user_departments(department_id, is_primary, department:departments(*))')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/login')

  const { data: userPerms } = await supabase
    .from('user_permissions')
    .select('feature_key, granted')
    .eq('user_id', user.id)

  const permissions: Record<string, boolean> = {}
  userPerms?.forEach((p: { feature_key: string; granted: boolean }) => { permissions[p.feature_key] = p.granted })

  const sessionUser: SessionUser = {
    id: user.id,
    email: user.email ?? '',
    name: profile.name,
    role: profile.role,
    permissions,
    departments: profile.user_departments?.map((ud: { department: unknown }) => ud.department) ?? [],
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* PCサイドバー */}
      <aside className="hidden sm:block flex-shrink-0">
        <Sidebar user={sessionUser} />
      </aside>

      {/* モバイルヘッダー */}
      <Header user={sessionUser} />

      {/* メインコンテンツ */}
      <main className="flex-1 overflow-y-auto pt-14 sm:pt-0 pb-16 sm:pb-0">
        <div className="max-w-4xl mx-auto p-4 sm:p-6">
          {children}
        </div>
      </main>

      {/* モバイルボトムナビ */}
      <BottomNav />
    </div>
  )
}
