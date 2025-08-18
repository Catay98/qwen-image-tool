-- ========================================
-- Supabase 管理员表设置脚本
-- ========================================

-- 1. 删除旧表（如果存在）
DROP TABLE IF EXISTS public.admins CASCADE;

-- 2. 创建管理员表
CREATE TABLE public.admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  email TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login TIMESTAMP WITH TIME ZONE
);

-- 3. 创建索引以提高查询性能
CREATE INDEX idx_admins_username ON public.admins(username);
CREATE INDEX idx_admins_active ON public.admins(is_active);

-- 4. 禁用 Row Level Security (RLS)
ALTER TABLE public.admins DISABLE ROW LEVEL SECURITY;

-- 5. 插入默认管理员账号
-- 用户名: admin
-- 密码: admin
-- MD5('admin') = 21232f297a57a5a743894a0e4a801fc3
INSERT INTO public.admins (username, password_hash, email, is_active)
VALUES ('admin', '21232f297a57a5a743894a0e4a801fc3', 'admin@example.com', true);

-- 6. 验证插入是否成功
SELECT 
  id,
  username, 
  password_hash,
  email, 
  is_active, 
  created_at 
FROM public.admins 
WHERE username = 'admin';

-- 7. 显示表结构
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'admins'
ORDER BY ordinal_position;

-- ========================================
-- 执行完成后，你应该看到：
-- 1. 一条 admin 用户记录
-- 2. password_hash 应该是: 21232f297a57a5a743894a0e4a801fc3
-- 3. 表结构信息
-- 
-- 然后你可以使用以下凭据登录：
-- 用户名: admin
-- 密码: admin
-- ========================================