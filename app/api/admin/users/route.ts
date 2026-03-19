import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { getSessionRoleLevel } from '@/lib/supabase/helpers'

async function requireAdmin(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const level = await getSessionRoleLevel(supabase, user.id)
  if (level < 100) return null
  return user
}

export async function GET() {
  const supabase = await createClient()
  const admin = await requireAdmin(supabase)
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { data, error } = await supabase
    .from('profiles')
    .select('*, role:roles(*), user_departments(department_id, is_primary, department:departments(id, name))')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // メールアドレスをAuth管理から取得
  const adminClient = await createAdminClient()
  const { data: authUsers } = await adminClient.auth.admin.listUsers()
  const emailMap = new Map(authUsers?.users?.map(u => [u.id, u.email]) ?? [])

  const result = data?.map(p => ({ ...p, email: emailMap.get(p.id) }))
  return NextResponse.json(result)
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const admin = await requireAdmin(supabase)
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json()
  const adminClient = await createAdminClient()

  // Supabase Authでユーザー作成
  const { data: authUser, error: authError } = await adminClient.auth.admin.createUser({
    email: body.email,
    password: body.password,
    email_confirm: true,
  })

  if (authError) return NextResponse.json({ error: authError.message }, { status: 500 })

  // プロフィール作成
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .insert({
      id: authUser.user.id,
      name: body.name,
      role_id: body.role_id,
      is_active: true,
    })
    .select()
    .single()

  if (profileError) return NextResponse.json({ error: profileError.message }, { status: 500 })

  // 部署紐付け
  if (body.department_ids?.length) {
    await supabase.from('user_departments').insert(
      body.department_ids.map((deptId: number, i: number) => ({
        user_id: profile.id,
        department_id: deptId,
        is_primary: i === 0,
      }))
    )
  }

  return NextResponse.json(profile, { status: 201 })
}
