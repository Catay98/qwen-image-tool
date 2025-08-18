-- ================================================
-- 最终数据库结构 - 订阅+积分双系统
-- 版本: 1.0.0
-- 创建时间: 2025-01-01
-- ================================================

-- ================================================
-- 第一步：清理旧表和函数
-- ================================================

-- 删除所有旧函数
DROP FUNCTION IF EXISTS add_user_points(UUID, INTEGER, DECIMAL, TEXT, TEXT) CASCADE;
DROP FUNCTION IF EXISTS get_user_points_info(UUID) CASCADE;
DROP FUNCTION IF EXISTS consume_user_points(UUID, INTEGER, TEXT) CASCADE;
DROP FUNCTION IF EXISTS record_api_usage(UUID, TEXT, JSONB) CASCADE;
DROP FUNCTION IF EXISTS clear_points_on_subscription_expire() CASCADE;

-- 删除所有旧触发器
DROP TRIGGER IF EXISTS subscription_expire_clear_points ON subscriptions;

-- 删除所有旧表（按依赖顺序）
DROP TABLE IF EXISTS points_logs CASCADE;
DROP TABLE IF EXISTS points_purchase_records CASCADE;
DROP TABLE IF EXISTS payment_records CASCADE;
DROP TABLE IF EXISTS payment_history CASCADE;
DROP TABLE IF EXISTS user_points CASCADE;
DROP TABLE IF EXISTS points_packages CASCADE;
DROP TABLE IF EXISTS subscriptions CASCADE;
DROP TABLE IF EXISTS user_subscriptions CASCADE;
DROP TABLE IF EXISTS subscription_plans CASCADE;
DROP TABLE IF EXISTS user_usage CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS image_history CASCADE;

-- ================================================
-- 第二步：创建核心表结构
-- ================================================

-- 1. 订阅计划表（系统配置）
CREATE TABLE subscription_plans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  duration_type TEXT NOT NULL CHECK (duration_type IN ('month', 'year')),
  duration_value INTEGER DEFAULT 1,
  price DECIMAL(10,2) NOT NULL,
  points INTEGER NOT NULL DEFAULT 0,
  description TEXT,
  features JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 用户订阅记录表
CREATE TABLE subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id UUID REFERENCES subscription_plans(id),
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

-- 3. 积分包配置表
CREATE TABLE points_packages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  points INTEGER NOT NULL,
  bonus_points INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. 用户积分余额表
CREATE TABLE user_points (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  total_points INTEGER DEFAULT 0,
  available_points INTEGER DEFAULT 0,
  used_points INTEGER DEFAULT 0,
  total_recharge DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. 积分变动日志表
CREATE TABLE points_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  points_change INTEGER NOT NULL,
  change_type VARCHAR(20) CHECK (change_type IN ('recharge', 'consume', 'expire', 'refund', 'gift', 'subscription')),
  reason TEXT,
  balance_after INTEGER,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. 积分购买记录表
CREATE TABLE points_purchase_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  package_id UUID REFERENCES points_packages(id),
  package_name VARCHAR(100),
  price DECIMAL(10,2) NOT NULL,
  points INTEGER NOT NULL,
  bonus_points INTEGER DEFAULT 0,
  total_points INTEGER NOT NULL,
  payment_method VARCHAR(50),
  payment_status VARCHAR(20) DEFAULT 'pending',
  transaction_id VARCHAR(255),
  payment_details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. 统一支付记录表
CREATE TABLE payment_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  payment_type VARCHAR(50) CHECK (payment_type IN ('subscription', 'points_package', 'upgrade', 'cancellation')),
  payment_method VARCHAR(50),
  payment_status VARCHAR(20) DEFAULT 'pending',
  transaction_id VARCHAR(255),
  payment_details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. 用户使用统计表
CREATE TABLE user_usage (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  total_uses INTEGER DEFAULT 0,
  api_calls INTEGER DEFAULT 0,
  free_uses_remaining INTEGER DEFAULT 10,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- 9. 用户扩展信息表
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255),
  name VARCHAR(255),
  avatar_url TEXT,
  provider VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 10. 图片生成历史表
CREATE TABLE image_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  prompt TEXT NOT NULL,
  image_url TEXT NOT NULL,
  model VARCHAR(50) DEFAULT 'qwen-vl-max-latest',
  size VARCHAR(20) DEFAULT '1024x1024',
  points_consumed INTEGER DEFAULT 10,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================================================
-- 第三步：创建索引优化性能
-- ================================================

-- 订阅相关索引
CREATE INDEX idx_subscriptions_user_status ON subscriptions(user_id, status);
CREATE INDEX idx_subscriptions_end_date ON subscriptions(end_date);
CREATE INDEX idx_subscription_plans_active ON subscription_plans(is_active);

-- 积分相关索引
CREATE INDEX idx_user_points_user ON user_points(user_id);
CREATE INDEX idx_points_logs_user ON points_logs(user_id);
CREATE INDEX idx_points_logs_created ON points_logs(created_at);
CREATE INDEX idx_points_logs_type ON points_logs(change_type);
CREATE INDEX idx_points_packages_active ON points_packages(is_active);
CREATE INDEX idx_points_purchase_user ON points_purchase_records(user_id);

-- 支付相关索引
CREATE INDEX idx_payment_records_user ON payment_records(user_id);
CREATE INDEX idx_payment_records_status ON payment_records(payment_status);
CREATE INDEX idx_payment_records_type ON payment_records(payment_type);

-- 使用统计索引
CREATE INDEX idx_user_usage_user_date ON user_usage(user_id, date);

-- 图片历史索引
CREATE INDEX idx_image_history_user ON image_history(user_id);
CREATE INDEX idx_image_history_created ON image_history(created_at);

-- ================================================
-- 第四步：创建核心函数
-- ================================================

-- 1. 添加用户积分函数
CREATE OR REPLACE FUNCTION add_user_points(
  p_user_id UUID,
  p_points INTEGER,
  p_amount DECIMAL(10,2),
  p_payment_method TEXT,
  p_transaction_id TEXT,
  p_change_type TEXT DEFAULT 'recharge'
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result JSON;
  v_new_balance INTEGER;
BEGIN
  -- 更新或插入用户积分
  INSERT INTO user_points (user_id, total_points, available_points, used_points, total_recharge)
  VALUES (p_user_id, p_points, p_points, 0, p_amount)
  ON CONFLICT (user_id) DO UPDATE
  SET 
    total_points = user_points.total_points + p_points,
    available_points = user_points.available_points + p_points,
    total_recharge = user_points.total_recharge + p_amount,
    updated_at = NOW()
  RETURNING available_points INTO v_new_balance;

  -- 创建积分日志
  INSERT INTO points_logs (
    user_id,
    points_change,
    change_type,
    reason,
    balance_after,
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
    jsonb_build_object(
      'amount', p_amount,
      'payment_method', p_payment_method,
      'transaction_id', p_transaction_id
    )
  );

  -- 返回结果
  v_result := json_build_object(
    'success', true,
    'points_added', p_points,
    'new_balance', v_new_balance
  );

  RETURN v_result;
END;
$$;

-- 2. 获取用户积分信息函数
CREATE OR REPLACE FUNCTION get_user_points_info(p_user_id UUID)
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
    'total_recharge', COALESCE(total_recharge, 0)
  ) INTO v_result
  FROM user_points
  WHERE user_id = p_user_id;

  -- 如果用户不存在，返回默认值
  IF v_result IS NULL THEN
    v_result := json_build_object(
      'total_points', 0,
      'available_points', 0,
      'used_points', 0,
      'total_recharge', 0
    );
  END IF;

  RETURN v_result;
END;
$$;

-- 3. 消耗用户积分函数
CREATE OR REPLACE FUNCTION consume_user_points(
  p_user_id UUID,
  p_points INTEGER,
  p_reason TEXT DEFAULT '生成图片'
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_available_points INTEGER;
  v_result JSON;
BEGIN
  -- 获取当前可用积分
  SELECT available_points INTO v_available_points
  FROM user_points
  WHERE user_id = p_user_id
  FOR UPDATE;

  IF v_available_points IS NULL OR v_available_points < p_points THEN
    RETURN json_build_object(
      'success', false,
      'error', '积分不足',
      'available_points', COALESCE(v_available_points, 0),
      'required_points', p_points
    );
  END IF;

  -- 扣除积分
  UPDATE user_points
  SET 
    available_points = available_points - p_points,
    used_points = used_points + p_points,
    updated_at = NOW()
  WHERE user_id = p_user_id;

  -- 记录积分日志
  INSERT INTO points_logs (
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

  RETURN json_build_object(
    'success', true,
    'points_consumed', p_points,
    'remaining_points', v_available_points - p_points
  );
END;
$$;

-- 4. 记录API使用函数
CREATE OR REPLACE FUNCTION record_api_usage(
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
  INSERT INTO user_usage (user_id, date, total_uses, api_calls, free_uses_remaining)
  VALUES (p_user_id, v_today, 1, 1, 9)
  ON CONFLICT (user_id, date) DO UPDATE
  SET 
    total_uses = user_usage.total_uses + 1,
    api_calls = user_usage.api_calls + 1,
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

-- 5. 订阅到期清零积分的触发器函数
CREATE OR REPLACE FUNCTION clear_points_on_subscription_expire()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_current_points INTEGER;
BEGIN
  -- 当订阅状态变为过期或取消时，清零用户积分
  IF NEW.status IN ('expired', 'canceled') AND OLD.status = 'active' THEN
    -- 获取当前积分
    SELECT available_points INTO v_current_points
    FROM user_points
    WHERE user_id = NEW.user_id;
    
    IF v_current_points > 0 THEN
      -- 清零积分
      UPDATE user_points
      SET 
        available_points = 0,
        used_points = total_points,
        updated_at = NOW()
      WHERE user_id = NEW.user_id;
      
      -- 记录积分清零日志
      INSERT INTO points_logs (
        user_id,
        points_change,
        change_type,
        reason,
        balance_after
      )
      VALUES (
        NEW.user_id,
        -v_current_points,
        'expire',
        '订阅到期，积分清零',
        0
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- 创建触发器
CREATE TRIGGER subscription_expire_clear_points
AFTER UPDATE ON subscriptions
FOR EACH ROW
EXECUTE FUNCTION clear_points_on_subscription_expire();

-- ================================================
-- 第五步：启用行级安全策略（RLS）
-- ================================================

-- 启用RLS
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE points_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE points_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE points_purchase_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE image_history ENABLE ROW LEVEL SECURITY;

-- 创建RLS策略

-- subscription_plans: 所有人可查看激活的计划
CREATE POLICY "Anyone can view active plans" ON subscription_plans
  FOR SELECT USING (is_active = true);

-- subscriptions: 用户只能查看自己的订阅
CREATE POLICY "Users can view own subscriptions" ON subscriptions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage subscriptions" ON subscriptions
  FOR ALL USING (auth.jwt()->>'role' = 'service_role');

-- user_points: 用户只能查看自己的积分
CREATE POLICY "Users can view own points" ON user_points
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage points" ON user_points
  FOR ALL USING (auth.jwt()->>'role' = 'service_role');

-- points_logs: 用户只能查看自己的日志
CREATE POLICY "Users can view own logs" ON points_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage logs" ON points_logs
  FOR ALL USING (auth.jwt()->>'role' = 'service_role');

-- payment_records: 用户只能查看自己的支付记录
CREATE POLICY "Users can view own payment records" ON payment_records
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage payment records" ON payment_records
  FOR ALL USING (auth.jwt()->>'role' = 'service_role');

-- points_packages: 所有人可查看激活的积分包
CREATE POLICY "Anyone can view active packages" ON points_packages
  FOR SELECT USING (is_active = true);

-- points_purchase_records: 用户只能查看自己的购买记录
CREATE POLICY "Users can view own purchase records" ON points_purchase_records
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage purchase records" ON points_purchase_records
  FOR ALL USING (auth.jwt()->>'role' = 'service_role');

-- user_usage: 用户只能查看自己的使用记录
CREATE POLICY "Users can view own usage" ON user_usage
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage usage" ON user_usage
  FOR ALL USING (auth.jwt()->>'role' = 'service_role');

-- users: 用户可以查看和更新自己的信息
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- image_history: 用户只能查看和创建自己的记录
CREATE POLICY "Users can view own images" ON image_history
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own images" ON image_history
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role can manage images" ON image_history
  FOR ALL USING (auth.jwt()->>'role' = 'service_role');

-- ================================================
-- 第六步：授予函数执行权限
-- ================================================

GRANT EXECUTE ON FUNCTION add_user_points TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_points_info TO authenticated;
GRANT EXECUTE ON FUNCTION consume_user_points TO authenticated;
GRANT EXECUTE ON FUNCTION record_api_usage TO authenticated;
GRANT EXECUTE ON FUNCTION add_user_points TO service_role;
GRANT EXECUTE ON FUNCTION get_user_points_info TO service_role;
GRANT EXECUTE ON FUNCTION consume_user_points TO service_role;
GRANT EXECUTE ON FUNCTION record_api_usage TO service_role;

-- ================================================
-- 第七步：插入初始数据
-- ================================================

-- 1. 插入订阅计划（必须先订阅才能使用系统）
INSERT INTO subscription_plans (name, duration_type, duration_value, price, points, description, features, is_active, sort_order)
VALUES 
  ('月度订阅', 'month', 1, 16.9, 680, '每月订阅，获得680积分', 
   '{
     "points": 680, 
     "description": "每月680积分，可生成约68张图片",
     "features": ["高清图片生成", "优先处理", "技术支持"]
   }'::jsonb, true, 1),
  ('年度订阅', 'year', 1, 118.8, 8000, '年度订阅，获得8000积分', 
   '{
     "points": 8000, 
     "description": "每年8000积分，可生成约800张图片", 
     "save": "节省$84.4",
     "features": ["高清图片生成", "优先处理", "技术支持", "专属客服"]
   }'::jsonb, true, 2);

-- 2. 插入积分包（订阅后可购买）
INSERT INTO points_packages (name, description, price, points, bonus_points, is_active, sort_order)
VALUES 
  ('基础积分包', '100积分，可生成10张图片', 9.9, 100, 0, true, 1),
  ('标准积分包', '500积分+50赠送，可生成55张图片', 39.9, 500, 50, true, 2),
  ('高级积分包', '1000积分+200赠送，可生成120张图片', 69.9, 1000, 200, true, 3),
  ('专业积分包', '2000积分+500赠送，可生成250张图片', 119.9, 2000, 500, true, 4),
  ('企业积分包', '5000积分+1500赠送，可生成650张图片', 249.9, 5000, 1500, true, 5);

-- ================================================
-- 第八步：创建实用视图（可选）
-- ================================================

-- 创建用户订阅状态视图
CREATE OR REPLACE VIEW user_subscription_status AS
SELECT 
  u.id as user_id,
  u.email,
  s.id as subscription_id,
  s.plan_name,
  s.status,
  s.start_date,
  s.end_date,
  p.available_points,
  p.used_points,
  p.total_recharge
FROM auth.users u
LEFT JOIN subscriptions s ON u.id = s.user_id AND s.status = 'active'
LEFT JOIN user_points p ON u.id = p.user_id;

-- 创建积分交易历史视图
CREATE OR REPLACE VIEW points_transaction_history AS
SELECT 
  pl.id,
  pl.user_id,
  u.email,
  pl.points_change,
  pl.change_type,
  pl.reason,
  pl.balance_after,
  pl.created_at
FROM points_logs pl
JOIN auth.users u ON pl.user_id = u.id
ORDER BY pl.created_at DESC;

-- ================================================
-- 完成提示
-- ================================================
-- 数据库结构创建完成！
-- 系统模式：订阅（门槛）+ 积分包（消耗品）
-- 用户流程：注册 → 订阅 → 获得初始积分 → 使用/购买更多积分
-- 订阅到期后积分自动清零
-- 所有图片生成消耗10积分