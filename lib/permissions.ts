import { Role, SessionUser } from '@/types'

export const ROLE_LEVELS = {
  admin: 100,
  leader: 80,
  trainer: 60,
  staff: 40,
  part_time: 20,
} as const

export const ROLE_LABELS: Record<string, string> = {
  admin: '管理者',
  leader: 'リーダー',
  trainer: 'トレーナー',
  staff: '社員',
  part_time: 'アルバイト',
}

export const DEFAULT_FEATURES: Array<{
  feature_key: string
  feature_label: string
  category: string
  min_role_level: number
}> = [
  { feature_key: 'announcement.create', feature_label: 'お知らせ作成', category: 'お知らせ', min_role_level: 80 },
  { feature_key: 'announcement.delete', feature_label: 'お知らせ削除', category: 'お知らせ', min_role_level: 80 },
  { feature_key: 'file.upload', feature_label: 'ファイルアップロード', category: 'データ管理', min_role_level: 40 },
  { feature_key: 'file.delete', feature_label: 'ファイル削除', category: 'データ管理', min_role_level: 80 },
  { feature_key: 'checklist.manage', feature_label: 'チェックリスト管理', category: 'チェックリスト', min_role_level: 100 },
  { feature_key: 'shift.view_all', feature_label: '全シフト閲覧', category: 'シフト', min_role_level: 80 },
  { feature_key: 'shift.manage', feature_label: 'シフト管理', category: 'シフト', min_role_level: 80 },
  { feature_key: 'user.manage', feature_label: 'ユーザー管理', category: '管理', min_role_level: 100 },
  { feature_key: 'dept.manage', feature_label: '部署管理', category: '管理', min_role_level: 100 },
  { feature_key: 'permission.manage', feature_label: '権限管理', category: '管理', min_role_level: 100 },
]

export function isAdmin(user: SessionUser) {
  return user.role.level >= ROLE_LEVELS.admin
}

export function isLeaderOrAbove(user: SessionUser) {
  return user.role.level >= ROLE_LEVELS.leader
}

export function hasMinLevel(user: SessionUser, level: number) {
  return user.role.level >= level
}

export function checkPermission(user: SessionUser, featureKey: string): boolean {
  // 個別オーバーライドが先
  if (featureKey in user.permissions) {
    return user.permissions[featureKey]
  }
  // デフォルトはロールレベルで判定
  const feature = DEFAULT_FEATURES.find(f => f.feature_key === featureKey)
  if (!feature) return false
  return user.role.level >= feature.min_role_level
}
