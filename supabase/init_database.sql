-- ================================================
-- Qwen Image Tool 数据库初始化脚本
-- 版本: 2.0.0
-- 创建时间: 2025-01-18
-- 
-- 说明：从零开始创建完整的数据库结构
-- 价格体系：
-- 积分包：$9.9/300积分，$19.9/700积分（有效期2个月）
-- 订阅：月度$16.9/680积分，年度$118.8/8000积分
-- 消耗：每次生成10积分
-- ================================================

-- ================================================
-- 第一部分：创建核心表结构
-- ================================================

-- 1. 管理员表（独立的管理系统）
CREATE TABLE IF NOT EXISTS public.admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(50) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  full_name VARCHAR(100),
  role VARCHAR(20) DEFAULT 'admin' CHECK (role IN ('super_admin', 'admin')),
  is_active BOOLEAN DEFAULT true,
  last_login TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 管理员操作日志表
CREATE TABLE IF NOT EXISTS public.admin_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES public.admins(id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL,
  target_type VARCHAR(50),
  target_id UUID,
  details JSONB DEFAULT '{}',
  ip_address INET,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. 订阅计划表
CREATE TABLE IF NOT EXISTS public.subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL UNIQUE,
  display_name JSONB DEFAULT '{"en": "", "zh": ""}',
  duration_type VARCHAR(20) NOT NULL CHECK (duration_type IN ('month', 'year')),
  duration_value INTEGER DEFAULT 1,
  price DECIMAL(10,2) NOT NULL,
  points INTEGER NOT NULL DEFAULT 0,
  description JSONB DEFAULT '{"en": "", "zh": ""}',
  features JSONB DEFAULT '[]',
  stripe_price_id VARCHAR(255),
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. 用户订阅记录表
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  plan_id UUID REFERENCES public.subscription_plans(id),
  plan_name VARCHAR(100),
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'canceled', 'expired', 'past_due')),
  start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  end_date TIMESTAMP WITH TIME ZONE,
  stripe_subscription_id VARCHAR(255),
  stripe_customer_id VARCHAR(255),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. 积分包配置表
CREATE TABLE IF NOT EXISTS public.points_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  display_name JSONB DEFAULT '{"en": "", "zh": ""}',
  description JSONB DEFAULT '{"en": "", "zh": ""}',
  price DECIMAL(10,2) NOT NULL,
  points INTEGER NOT NULL,
  validity_days INTEGER DEFAULT 60, -- 有效期默认60天（2个月）
  stripe_price_id VARCHAR(255),
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. 用户积分余额表
CREATE TABLE IF NOT EXISTS public.user_points (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  total_points INTEGER DEFAULT 0 CHECK (total_points >= 0),
  available_points INTEGER DEFAULT 0 CHECK (available_points >= 0),
  used_points INTEGER DEFAULT 0 CHECK (used_points >= 0),
  expired_points INTEGER DEFAULT 0 CHECK (expired_points >= 0),
  total_recharge DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. 积分变动日志表
CREATE TABLE IF NOT EXISTS public.points_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  points_change INTEGER NOT NULL,
  change_type VARCHAR(20) CHECK (change_type IN ('recharge', 'consume', 'expire', 'refund', 'subscription')),
  reason TEXT,
  balance_after INTEGER,
  expire_at TIMESTAMP WITH TIME ZONE, -- 积分过期时间
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. 积分购买记录表
CREATE TABLE IF NOT EXISTS public.points_purchase_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  package_id UUID REFERENCES public.points_packages(id),
  package_name VARCHAR(100),
  price DECIMAL(10,2) NOT NULL,
  points INTEGER NOT NULL,
  payment_method VARCHAR(50),
  payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'processing', 'succeeded', 'failed', 'canceled', 'refunded')),
  stripe_payment_intent_id VARCHAR(255),
  expire_at TIMESTAMP WITH TIME ZONE, -- 积分过期时间
  payment_details JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. 统一支付记录表
CREATE TABLE IF NOT EXISTS public.payment_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  payment_type VARCHAR(50) CHECK (payment_type IN ('subscription', 'points_package')),
  payment_method VARCHAR(50),
  payment_status VARCHAR(20) DEFAULT 'pending',
  transaction_id VARCHAR(255),
  stripe_payment_intent_id VARCHAR(255),
  payment_details JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 10. 用户使用统计表
CREATE TABLE IF NOT EXISTS public.user_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  date DATE NOT NULL,
  total_uses INTEGER DEFAULT 0,
  free_uses INTEGER DEFAULT 0,  -- 当日使用的免费次数
  free_uses_remaining INTEGER DEFAULT 10, -- 剩余免费次数（总计）
  points_consumed INTEGER DEFAULT 0,
  images_generated INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- 11. 用户扩展信息表
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY,
  email VARCHAR(255),
  name VARCHAR(255),
  avatar_url TEXT,
  provider VARCHAR(50),
  locale VARCHAR(10) DEFAULT 'en',
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 12. 图片生成历史表
CREATE TABLE IF NOT EXISTS public.image_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  prompt TEXT NOT NULL,
  image_url TEXT NOT NULL,
  model VARCHAR(50) DEFAULT 'qwen-vl-max-latest',
  size VARCHAR(20) DEFAULT '1024x1024',
  points_consumed INTEGER DEFAULT 10,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================================================
-- 第二部分：创建索引优化性能
-- ================================================

-- 管理员相关索引
CREATE INDEX IF NOT EXISTS idx_admins_username ON public.admins(username);
CREATE INDEX IF NOT EXISTS idx_admins_active ON public.admins(is_active);
CREATE INDEX IF NOT EXISTS idx_admin_logs_admin ON public.admin_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_logs_created ON public.admin_logs(created_at);

-- 订阅相关索引
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_status ON public.subscriptions(user_id, status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_end_date ON public.subscriptions(end_date);
CREATE INDEX IF NOT EXISTS idx_subscription_plans_active ON public.subscription_plans(is_active);

-- 积分相关索引
CREATE INDEX IF NOT EXISTS idx_user_points_user ON public.user_points(user_id);
CREATE INDEX IF NOT EXISTS idx_points_logs_user ON public.points_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_points_logs_created ON public.points_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_points_logs_type ON public.points_logs(change_type);
CREATE INDEX IF NOT EXISTS idx_points_logs_expire ON public.points_logs(expire_at);
CREATE INDEX IF NOT EXISTS idx_points_packages_active ON public.points_packages(is_active);
CREATE INDEX IF NOT EXISTS idx_points_purchase_user ON public.points_purchase_records(user_id);
CREATE INDEX IF NOT EXISTS idx_points_purchase_status ON public.points_purchase_records(payment_status);

-- 支付相关索引
CREATE INDEX IF NOT EXISTS idx_payment_records_user ON public.payment_records(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_records_status ON public.payment_records(payment_status);
CREATE INDEX IF NOT EXISTS idx_payment_records_type ON public.payment_records(payment_type);

-- 使用统计索引
CREATE INDEX IF NOT EXISTS idx_user_usage_user_date ON public.user_usage(user_id, date);

-- 图片历史索引
CREATE INDEX IF NOT EXISTS idx_image_history_user ON public.image_history(user_id);
CREATE INDEX IF NOT EXISTS idx_image_history_created ON public.image_history(created_at);

-- ================================================
-- 第三部分：创建核心函数
-- ================================================

-- 1. 管理员认证函数
CREATE OR REPLACE FUNCTION public.check_admin_credentials(
  p_username VARCHAR,
  p_password_hash VARCHAR
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_admin RECORD;
BEGIN
  SELECT * INTO v_admin
  FROM public.admins
  WHERE username = p_username
    AND password_hash = p_password_hash
    AND is_active = true;
  
  IF v_admin.id IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Invalid credentials'
    );
  END IF;
  
  -- 更新最后登录时间
  UPDATE public.admins
  SET last_login = NOW()
  WHERE id = v_admin.id;
  
  -- 记录登录日志
  INSERT INTO public.admin_logs (admin_id, action, details)
  VALUES (v_admin.id, 'login', json_build_object('timestamp', NOW()));
  
  RETURN json_build_object(
    'success', true,
    'admin', json_build_object(
      'id', v_admin.id,
      'username', v_admin.username,
      'email', v_admin.email,
      'role', v_admin.role
    )
  );
END;
$$;

-- 2. 添加用户积分函数（支持过期时间）
CREATE OR REPLACE FUNCTION public.add_user_points(
  p_user_id UUID,
  p_points INTEGER,
  p_amount DECIMAL(10,2),
  p_payment_method TEXT,
  p_transaction_id TEXT,
  p_change_type TEXT DEFAULT 'recharge',
  p_expire_days INTEGER DEFAULT 60
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result JSON;
  v_new_balance INTEGER;
  v_expire_at TIMESTAMP WITH TIME ZONE;
BEGIN
  -- 计算过期时间（积分包2个月有效期）
  IF p_change_type = 'recharge' AND p_expire_days > 0 THEN
    v_expire_at := NOW() + INTERVAL '1 day' * p_expire_days;
  END IF;
  
  -- 更新或插入用户积分
  INSERT INTO public.user_points (user_id, total_points, available_points, used_points, total_recharge)
  VALUES (p_user_id, p_points, p_points, 0, p_amount)
  ON CONFLICT (user_id) DO UPDATE
  SET 
    total_points = user_points.total_points + p_points,
    available_points = user_points.available_points + p_points,
    total_recharge = user_points.total_recharge + p_amount,
    updated_at = NOW()
  RETURNING available_points INTO v_new_balance;
  
  -- 创建积分日志
  INSERT INTO public.points_logs (
    user_id,
    points_change,
    change_type,
    reason,
    balance_after,
    expire_at,
    metadata
  )
  VALUES (
    p_user_id,
    p_points,
    p_change_type,
    CASE 
      WHEN p_change_type = 'subscription' THEN '订阅赠送积分'
      WHEN p_change_type = 'recharge' THEN '积分充值'
      ELSE '积分添加'
    END,
    v_new_balance,
    v_expire_at,
    jsonb_build_object(
      'amount', p_amount,
      'payment_method', p_payment_method,
      'transaction_id', p_transaction_id
    )
  );
  
  RETURN json_build_object(
    'success', true,
    'points_added', p_points,
    'new_balance', v_new_balance,
    'expire_at', v_expire_at
  );
END;
$$;

-- 3. 消耗用户积分函数（每次生成消耗10积分）
CREATE OR REPLACE FUNCTION public.consume_user_points(
  p_user_id UUID,
  p_points INTEGER DEFAULT 10,
  p_reason TEXT DEFAULT '生成图片'
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_available_points INTEGER;
BEGIN
  -- 获取当前可用积分
  SELECT available_points INTO v_available_points
  FROM public.user_points
  WHERE user_id = p_user_id
  FOR UPDATE;
  
  IF v_available_points IS NULL OR v_available_points < p_points THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Insufficient points',
      'available_points', COALESCE(v_available_points, 0),
      'required_points', p_points
    );
  END IF;
  
  -- 扣除积分
  UPDATE public.user_points
  SET 
    available_points = available_points - p_points,
    used_points = used_points + p_points,
    updated_at = NOW()
  WHERE user_id = p_user_id;
  
  -- 记录积分日志
  INSERT INTO public.points_logs (
    user_id,
    points_change,
    change_type,
    reason,
    balance_after
  )
  VALUES (
    p_user_id,
    -p_points,
    'consume',
    p_reason,
    v_available_points - p_points
  );
  
  -- 更新使用统计
  INSERT INTO public.user_usage (user_id, date, points_consumed, images_generated)
  VALUES (p_user_id, CURRENT_DATE, p_points, 1)
  ON CONFLICT (user_id, date) DO UPDATE
  SET 
    points_consumed = user_usage.points_consumed + p_points,
    images_generated = user_usage.images_generated + 1,
    updated_at = NOW();
  
  RETURN json_build_object(
    'success', true,
    'points_consumed', p_points,
    'remaining_points', v_available_points - p_points
  );
END;
$$;

-- 4. 消耗积分或免费次数的统一函数（总计10次免费机会）
CREATE OR REPLACE FUNCTION public.consume_points_for_generation(
  p_user_id UUID,
  p_api_endpoint TEXT DEFAULT '/api/generate-image-v2',
  p_details JSONB DEFAULT '{}'::jsonb
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_total_free_uses INTEGER;
  v_available_points INTEGER;
  v_total_free_limit INTEGER := 10; -- 总计10次免费机会
  v_points_per_generation INTEGER := 10; -- 每次生成消耗10积分
  v_result JSON;
BEGIN
  -- 获取用户总计已使用的免费次数
  SELECT COALESCE(SUM(free_uses), 0) INTO v_total_free_uses
  FROM public.user_usage
  WHERE user_id = p_user_id;
  
  -- 获取用户可用积分
  SELECT available_points INTO v_available_points
  FROM public.user_points
  WHERE user_id = p_user_id;
  
  -- 如果用户没有积分记录，创建一个
  IF v_available_points IS NULL THEN
    INSERT INTO public.user_points (user_id, total_points, available_points, used_points, expired_points)
    VALUES (p_user_id, 0, 0, 0, 0)
    ON CONFLICT (user_id) DO NOTHING;
    v_available_points := 0;
  END IF;
  
  -- 判断是否可以使用免费次数（总计10次）
  IF v_total_free_uses < v_total_free_limit THEN
    -- 使用免费次数
    INSERT INTO public.user_usage (user_id, date, free_uses, images_generated)
    VALUES (p_user_id, CURRENT_DATE, 1, 1)
    ON CONFLICT (user_id, date) DO UPDATE
    SET 
      free_uses = user_usage.free_uses + 1,
      images_generated = user_usage.images_generated + 1,
      updated_at = NOW();
    
    RETURN json_build_object(
      'success', true,
      'used_points', false,
      'free_uses_remaining', v_total_free_limit - v_total_free_uses - 1,
      'available_points', v_available_points,
      'message', '使用免费次数生成'
    );
  ELSIF v_available_points >= v_points_per_generation THEN
    -- 使用积分
    UPDATE public.user_points
    SET 
      available_points = available_points - v_points_per_generation,
      used_points = used_points + v_points_per_generation,
      updated_at = NOW()
    WHERE user_id = p_user_id;
    
    -- 记录积分日志
    INSERT INTO public.points_logs (
      user_id,
      points_change,
      change_type,
      reason,
      balance_after
    )
    VALUES (
      p_user_id,
      -v_points_per_generation,
      'consume',
      '生成图片',
      v_available_points - v_points_per_generation
    );
    
    -- 更新使用统计
    INSERT INTO public.user_usage (user_id, date, points_consumed, images_generated)
    VALUES (p_user_id, CURRENT_DATE, v_points_per_generation, 1)
    ON CONFLICT (user_id, date) DO UPDATE
    SET 
      points_consumed = user_usage.points_consumed + v_points_per_generation,
      images_generated = user_usage.images_generated + 1,
      updated_at = NOW();
    
    RETURN json_build_object(
      'success', true,
      'used_points', true,
      'free_uses_remaining', 0,
      'available_points', v_available_points - v_points_per_generation,
      'message', '使用积分生成'
    );
  ELSE
    -- 既没有免费次数也没有足够积分
    RETURN json_build_object(
      'success', false,
      'used_points', false,
      'free_uses_remaining', 0,
      'available_points', v_available_points,
      'message', '免费次数已用完，积分不足，请充值继续使用'
    );
  END IF;
END;
$$;

-- 5. 获取用户积分信息函数
CREATE OR REPLACE FUNCTION public.get_user_points_info(p_user_id UUID)
RETURNS JSON
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_result JSON;
BEGIN
  SELECT json_build_object(
    'total_points', COALESCE(total_points, 0),
    'available_points', COALESCE(available_points, 0),
    'used_points', COALESCE(used_points, 0),
    'expired_points', COALESCE(expired_points, 0),
    'total_recharge', COALESCE(total_recharge, 0)
  ) INTO v_result
  FROM public.user_points
  WHERE user_id = p_user_id;
  
  IF v_result IS NULL THEN
    v_result := json_build_object(
      'total_points', 0,
      'available_points', 0,
      'used_points', 0,
      'expired_points', 0,
      'total_recharge', 0
    );
  END IF;
  
  RETURN v_result;
END;
$$;

-- 5. 记录API使用函数
CREATE OR REPLACE FUNCTION public.record_api_usage(
  p_user_id UUID,
  p_api_endpoint TEXT DEFAULT NULL,
  p_details JSONB DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
AS $$
DECLARE
  v_today DATE := CURRENT_DATE;
  v_free_remaining INTEGER;
  v_result JSON;
BEGIN
  -- 插入或更新今日使用记录
  INSERT INTO public.user_usage (user_id, date, total_uses, free_uses_remaining)
  VALUES (p_user_id, v_today, 1, 9)
  ON CONFLICT (user_id, date) DO UPDATE
  SET 
    total_uses = user_usage.total_uses + 1,
    free_uses_remaining = GREATEST(0, user_usage.free_uses_remaining - 1),
    updated_at = NOW()
  RETURNING free_uses_remaining INTO v_free_remaining;
  
  v_result := json_build_object(
    'success', true,
    'free_uses_remaining', v_free_remaining,
    'date', v_today
  );
  
  RETURN v_result;
END;
$$;

-- 6. 获取用户完整信息函数
CREATE OR REPLACE FUNCTION public.get_user_complete_info(p_user_id UUID)
RETURNS JSON
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_result JSON;
BEGIN
  SELECT json_build_object(
    'user', json_build_object(
      'id', u.id,
      'email', u.email,
      'name', u.name,
      'avatar_url', u.avatar_url,
      'created_at', u.created_at
    ),
    'subscription', json_build_object(
      'plan_name', s.plan_name,
      'status', s.status,
      'start_date', s.start_date,
      'end_date', s.end_date
    ),
    'points', json_build_object(
      'total_points', COALESCE(p.total_points, 0),
      'available_points', COALESCE(p.available_points, 0),
      'used_points', COALESCE(p.used_points, 0),
      'total_recharge', COALESCE(p.total_recharge, 0)
    ),
    'usage_today', json_build_object(
      'free_uses_remaining', COALESCE(us.free_uses_remaining, 10),
      'points_consumed', COALESCE(us.points_consumed, 0),
      'images_generated', COALESCE(us.images_generated, 0)
    )
  ) INTO v_result
  FROM public.users u
  LEFT JOIN public.subscriptions s ON u.id = s.user_id AND s.status = 'active'
  LEFT JOIN public.user_points p ON u.id = p.user_id
  LEFT JOIN public.user_usage us ON u.id = us.user_id AND us.date = CURRENT_DATE
  WHERE u.id = p_user_id;
  
  RETURN v_result;
END;
$$;

-- ================================================
-- 第四部分：创建触发器
-- ================================================

-- 自动更新updated_at时间戳
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 为需要的表创建触发器
DO $$
BEGIN
  -- 管理员表
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_admins_updated_at') THEN
    CREATE TRIGGER update_admins_updated_at BEFORE UPDATE ON public.admins
      FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
  
  -- 用户表
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_users_updated_at') THEN
    CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
      FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
  
  -- 订阅表
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_subscriptions_updated_at') THEN
    CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON public.subscriptions
      FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
  
  -- 用户积分表
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_user_points_updated_at') THEN
    CREATE TRIGGER update_user_points_updated_at BEFORE UPDATE ON public.user_points
      FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

-- ================================================
-- 第五部分：创建视图
-- ================================================

-- 用户概览视图
CREATE OR REPLACE VIEW public.user_overview AS
SELECT 
  u.id,
  u.email,
  u.name,
  u.created_at,
  s.plan_name as current_plan,
  s.status as subscription_status,
  s.end_date as subscription_end,
  p.available_points,
  p.total_recharge,
  (SELECT COUNT(*) FROM public.image_history WHERE user_id = u.id) as total_images,
  (SELECT SUM(points_consumed) FROM public.user_usage WHERE user_id = u.id) as total_points_consumed
FROM public.users u
LEFT JOIN public.subscriptions s ON u.id = s.user_id AND s.status = 'active'
LEFT JOIN public.user_points p ON u.id = p.user_id;

-- 每日统计视图
CREATE OR REPLACE VIEW public.daily_statistics AS
SELECT 
  date,
  COUNT(DISTINCT user_id) as active_users,
  SUM(points_consumed) as total_points_consumed,
  SUM(images_generated) as total_images_generated
FROM public.user_usage
GROUP BY date
ORDER BY date DESC;

-- ================================================
-- 第六部分：插入初始数据
-- ================================================

-- 1. 插入默认管理员账号（如果不存在）
-- 用户名: admin / 密码: admin123 (MD5: 0192023a7bbd73250516f069df18b500)
INSERT INTO public.admins (username, password_hash, email, full_name, role, is_active)
VALUES 
  ('admin', '0192023a7bbd73250516f069df18b500', 'admin@qwenimage.com', 'System Administrator', 'super_admin', true)
ON CONFLICT (username) DO NOTHING;

-- 2. 插入订阅计划（如果不存在）
INSERT INTO public.subscription_plans (name, display_name, duration_type, duration_value, price, points, description, features, is_active, sort_order)
VALUES 
  ('monthly_subscription', 
   '{"en": "Monthly Subscription", "zh": "月度订阅"}'::jsonb,
   'month', 1, 16.90, 680,
   '{"en": "680 points per month", "zh": "每月680积分"}'::jsonb,
   '[
     {"en": "680 points/month", "zh": "每月680积分"},
     {"en": "Can generate 68 images", "zh": "可生成68张图片"},
     {"en": "Priority processing", "zh": "优先处理"},
     {"en": "Technical support", "zh": "技术支持"}
   ]'::jsonb,
   true, 1),
   
  ('yearly_subscription', 
   '{"en": "Yearly Subscription", "zh": "年度订阅"}'::jsonb,
   'year', 1, 118.80, 8000,
   '{"en": "8000 points per year", "zh": "每年8000积分"}'::jsonb,
   '[
     {"en": "8000 points/year", "zh": "每年8000积分"},
     {"en": "Can generate 800 images", "zh": "可生成800张图片"},
     {"en": "Save $84.4", "zh": "节省$84.4"},
     {"en": "Priority processing", "zh": "优先处理"},
     {"en": "Dedicated support", "zh": "专属客服"}
   ]'::jsonb,
   true, 2)
ON CONFLICT (name) DO NOTHING;

-- 3. 插入积分包（如果不存在）
INSERT INTO public.points_packages (name, display_name, description, price, points, validity_days, is_active, sort_order)
VALUES 
  ('points_300',
   '{"en": "300 Points Pack", "zh": "300积分包"}'::jsonb,
   '{"en": "300 points, can generate 30 images", "zh": "300积分，可生成30张图片"}'::jsonb,
   9.90, 300, 60, true, 1),
   
  ('points_700',
   '{"en": "700 Points Pack", "zh": "700积分包"}'::jsonb,
   '{"en": "700 points, can generate 70 images", "zh": "700积分，可生成70张图片"}'::jsonb,
   19.90, 700, 60, true, 2)
ON CONFLICT DO NOTHING;

-- ================================================
-- 第七部分：设置权限
-- ================================================

-- 授予函数执行权限
GRANT EXECUTE ON FUNCTION public.check_admin_credentials TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.add_user_points TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.consume_user_points TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_user_points_info TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_user_complete_info TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.record_api_usage TO authenticated, service_role;

-- 授予表访问权限
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT INSERT, UPDATE ON public.users TO authenticated;
GRANT INSERT ON public.image_history TO authenticated;

-- ================================================
-- 完成提示
-- ================================================
-- 数据库初始化完成！
-- 
-- 价格体系：
-- 1. 积分包：
--    - $9.9 = 300积分（可生成30张图片）
--    - $19.9 = 700积分（可生成70张图片）
--    - 有效期：2个月
-- 
-- 2. 订阅套餐：
--    - 月度订阅：$16.9 = 680积分（可生成68张图片）
--    - 年度订阅：$118.8 = 8000积分（可生成800张图片）
-- 
-- 3. 消耗规则：
--    - 每次生成消耗10积分
-- 
-- 默认管理员账号：
-- 用户名：admin
-- 密码：admin123
-- 
-- 注意：这个脚本会创建所有必要的表、函数和初始数据
-- 可以安全地在新数据库或现有数据库上运行