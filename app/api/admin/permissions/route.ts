import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { DEFAULT_FEATURES } from '@/lib/permissions'
import { getSessionRoleLevel } from '@/lib/supabase/helpers'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if ((await getSessionRoleLevel(supabase, user.id)) < 100) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const [{ data: features }, { data: userPerms }, { data: roles }] = await Promise.all([
    supabase.from('feature_permissions').select('*').order('category'),
    supabase.from('user_permissions').select('*, user:profiles!user_id(id, name)'),
    supabase.from('roles').select('*').order('level', { ascending: false }),
  ])

  return NextResponse.json({ features, userPerms, roles })
}

export async function PUT(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if ((await getSessionRoleLevel(supabase, user.id)) < 100) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json()

  if (body.type === 'feature') {
    // 役職デフォルト権限の更新
    await supabase
      .from('feature_permissions')
      .update({ min_role_level: body.min_role_level })
      .eq('feature_key', body.feature_key)
  } else if (body.type === 'user') {
    // ユーザー個別権限
    if (body.granted === null) {
      await supabase
        .from('user_permissions')
        .delete()
        .eq('user_id', body.user_id)
        .eq('feature_key', body.feature_key)
    } else {
      await supabase
        .from('user_permissions')
        .upsert({
          user_id: body.user_id,
          feature_key: body.feature_key,
          granted: body.granted,
        }, { onConflict: 'user_id,feature_key' })
    }
  }

  return NextResponse.json({ success: true })
}
