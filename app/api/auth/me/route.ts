import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('*, role:roles(*), user_departments(department_id, is_primary, department:departments(*))')
    .eq('id', user.id)
    .single()

  if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

  const { data: userPerms } = await supabase
    .from('user_permissions')
    .select('feature_key, granted')
    .eq('user_id', user.id)

  const permissions: Record<string, boolean> = {}
  userPerms?.forEach(p => { permissions[p.feature_key] = p.granted })

  const departments = profile.user_departments?.map((ud: { department: unknown }) => ud.department) ?? []

  return NextResponse.json({
    id: user.id,
    email: user.email,
    name: profile.name,
    role: profile.role,
    permissions,
    departments,
  })
}
