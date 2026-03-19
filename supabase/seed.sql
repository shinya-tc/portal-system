-- ロール初期データ
INSERT INTO roles (name, label, level) VALUES
  ('admin',     '管理者',       100),
  ('leader',    'リーダー',      80),
  ('trainer',   'トレーナー',    60),
  ('staff',     '社員',          40),
  ('part_time', 'アルバイト',    20);

-- 部署初期データ
INSERT INTO departments (name) VALUES
  ('販売'),
  ('買取'),
  ('通販'),
  ('在庫'),
  ('バイヤー'),
  ('経理'),
  ('人事'),
  ('マネージャー');

-- 部署ごとのデフォルトフォルダ作成
INSERT INTO dept_folders (department_id, name)
SELECT d.id, f.name
FROM departments d
CROSS JOIN (VALUES ('印刷物'), ('マニュアル')) AS f(name);

-- 機能権限初期データ
INSERT INTO feature_permissions (feature_key, feature_label, category, min_role_level) VALUES
  ('announcement.create', 'お知らせ作成',          'お知らせ',     80),
  ('announcement.delete', 'お知らせ削除',          'お知らせ',     80),
  ('file.upload',         'ファイルアップロード',   'データ管理',   40),
  ('file.delete',         'ファイル削除',           'データ管理',   80),
  ('checklist.manage',    'チェックリスト管理',     'チェックリスト', 100),
  ('shift.view_all',      '全シフト閲覧',           'シフト',       80),
  ('shift.manage',        'シフト管理',             'シフト',       80),
  ('user.manage',         'ユーザー管理',           '管理',         100),
  ('dept.manage',         '部署管理',               '管理',         100),
  ('permission.manage',   '権限管理',               '管理',         100);

-- ※ 管理者ユーザーは Supabase Dashboard から手動で作成し、
--    以下のSQLでプロフィールを設定してください:
-- INSERT INTO profiles (id, name, role_id) VALUES
--   ('<auth.users の UUID>', '管理者', (SELECT id FROM roles WHERE name = 'admin'));
