-- ================================================
-- 清理并重建数据库（纯字符串版本）
-- ================================================

-- 删除现有表（如果存在）
DROP TABLE IF EXISTS public.subscription_plans CASCADE;
DROP TABLE IF EXISTS public.points_packages CASCADE;
DROP TABLE IF EXISTS public.subscriptions CASCADE;
DROP TABLE IF EXISTS public.user_points CASCADE;

-- 1. 创建订阅计划表（使用纯字符串）
CREATE TABLE public.subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL UNIQUE,
  display_name VARCHAR(255) NOT NULL,
  duration_type VARCHAR(20) NOT NULL CHECK (duration_type IN ('month', 'year')),
  duration_value INTEGER DEFAULT 1,
  price DECIMAL(10,2) NOT NULL,
  points INTEGER NOT NULL DEFAULT 0,
  description TEXT,
  features TEXT[],
  stripe_price_id VARCHAR(255),
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 创建积分包表（使用纯字符串）
CREATE TABLE public.points_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  display_name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  points INTEGER NOT NULL,
  validity_days INTEGER DEFAULT 60,
  features TEXT[],
  stripe_price_id VARCHAR(255),
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. 创建用户订阅表
CREATE TABLE public.subscriptions (
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

-- 4. 创建用户积分表
CREATE TABLE public.user_points (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  total_points INTEGER DEFAULT 0 CHECK (total_points >= 0),
  available_points INTEGER DEFAULT 0 CHECK (available_points >= 0),
  used_points INTEGER DEFAULT 0 CHECK (used_points >= 0),
  expired_points INTEGER DEFAULT 0 CHECK (expired_points >= 0),
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. 插入订阅计划数据（中文）
INSERT INTO public.subscription_plans (name, display_name, duration_type, duration_value, price, points, description, features, is_active, sort_order)
VALUES 
  ('monthly_subscription', '月度订阅', 'month', 1, 16.9, 680, 
   '每月680积分，适合经常使用的用户', 
   ARRAY['每月680积分', '优先处理队列', '批量生成功能', '历史记录永久保存'],
   true, 1),
  ('yearly_subscription', '年度订阅', 'year', 1, 118.8, 8000, 
   '每年8000积分，最划算的选择', 
   ARRAY['每年8000积分', '优先处理队列', '批量生成功能', '历史记录永久保存', '额外赠送积分'],
   true, 2);

-- 6. 插入积分包数据（中文）
INSERT INTO public.points_packages (name, display_name, price, points, validity_days, description, features, is_active, sort_order)
VALUES 
  ('points_300', '300积分包', 9.9, 300, 60, 
   '适合轻度使用，可生成30张图片',
   ARRAY['300积分', '有效期60天', '灵活使用'],
   true, 1),
  ('points_700', '700积分包', 19.9, 700, 60, 
   '适合重度使用，可生成70张图片',
   ARRAY['700积分', '有效期60天', '批量优惠', '更划算'],
   true, 2);

-- 7. 创建用户使用记录表
CREATE TABLE IF NOT EXISTS public.user_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  action TEXT NOT NULL,
  credits_used INTEGER DEFAULT 0,
  free_uses INTEGER DEFAULT 0,
  total_free_uses INTEGER DEFAULT 10,
  details JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. 创建索引
CREATE INDEX idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON public.subscriptions(status);
CREATE INDEX idx_user_points_user_id ON public.user_points(user_id);
CREATE INDEX idx_user_usage_user_id ON public.user_usage(user_id);

-- 9. 创建消耗积分的函数
CREATE OR REPLACE FUNCTION public.consume_points_for_generation(
  p_user_id UUID,
  p_api_endpoint TEXT DEFAULT '/api/generate-image-v2',
  p_details JSONB DEFAULT '{}'::jsonb
)
RETURNS JSONB AS $$
DECLARE
  v_free_uses INTEGER;
  v_total_free_uses INTEGER := 10;
  v_points_needed INTEGER := 10;
  v_available_points INTEGER;
  v_result JSONB;
BEGIN
  -- 获取用户的免费使用次数
  SELECT COALESCE(SUM(free_uses), 0) INTO v_free_uses
  FROM public.user_usage
  WHERE user_id = p_user_id;

  -- 检查是否还有免费使用次数
  IF v_free_uses < v_total_free_uses THEN
    -- 使用免费次数
    INSERT INTO public.user_usage (user_id, action, free_uses, total_free_uses, details)
    VALUES (p_user_id, p_api_endpoint, 1, v_total_free_uses, p_details);
    
    v_result := jsonb_build_object(
      'success', true,
      'type', 'free',
      'free_uses_remaining', v_total_free_uses - v_free_uses - 1,
      'message', '使用免费次数生成'
    );
    RETURN v_result;
  END IF;

  -- 获取用户积分
  SELECT available_points INTO v_available_points
  FROM public.user_points
  WHERE user_id = p_user_id;

  -- 检查积分是否足够
  IF v_available_points IS NULL OR v_available_points < v_points_needed THEN
    v_result := jsonb_build_object(
      'success', false,
      'error', 'insufficient_points',
      'message', '积分不足，请充值',
      'points_needed', v_points_needed,
      'points_available', COALESCE(v_available_points, 0)
    );
    RETURN v_result;
  END IF;

  -- 扣除积分
  UPDATE public.user_points
  SET 
    available_points = available_points - v_points_needed,
    used_points = used_points + v_points_needed,
    last_updated = NOW()
  WHERE user_id = p_user_id;

  -- 记录使用
  INSERT INTO public.user_usage (user_id, action, credits_used, details)
  VALUES (p_user_id, p_api_endpoint, v_points_needed, p_details);

  v_result := jsonb_build_object(
    'success', true,
    'type', 'paid',
    'points_consumed', v_points_needed,
    'points_remaining', v_available_points - v_points_needed,
    'message', '成功消耗积分'
  );
  RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- 10. 授权
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;