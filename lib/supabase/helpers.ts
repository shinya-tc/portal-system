import { createClient } from './server'

// Supabaseのjoin結果からrole levelを安全に取得するヘルパー
export function extractRoleLevel(roleField: unknown): number {
  if (!roleField) return 0
  if (Array.isArray(roleField)) {
    return (roleField[0] as { level?: number })?.level ?? 0
  }
  return (roleField as { level?: number })?.level ?? 0
}

export async function getSessionRoleLevel(supabase: Awaited<ReturnType<typeof createClient>>, userId: string): Promise<number> {
  const { data } = await supabase
    .from('profiles')
    .select('role:roles(level)')
    .eq('id', userId)
    .single()
  return extractRoleLevel(data?.role)
}
