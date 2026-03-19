import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getSessionRoleLevel } from '@/lib/supabase/helpers'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const roleLevel = await getSessionRoleLevel(supabase, user.id)
  if (roleLevel < 80) redirect('/')

  return <>{children}</>
}
