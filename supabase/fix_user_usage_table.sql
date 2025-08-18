-- 修复 user_usage 表结构，添加 free_uses 列
ALTER TABLE public.user_usage 
ADD COLUMN IF NOT EXISTS free_uses INTEGER DEFAULT 0;

-- 更新现有数据：将已使用的免费次数设置为 10 - free_uses_remaining
UPDATE public.user_usage 
SET free_uses = GREATEST(0, 10 - COALESCE(free_uses_remaining, 10))
WHERE free_uses IS NULL;

-- 创建改进版的消耗积分函数
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
  v_user_exists BOOLEAN;
BEGIN
  -- 检查用户是否存在积分记录，如果不存在则创建
  SELECT EXISTS(SELECT 1 FROM public.user_points WHERE user_id = p_user_id) INTO v_user_exists;
  
  IF NOT v_user_exists THEN
    INSERT INTO public.user_points (user_id, total_points, available_points, used_points, expired_points)
    VALUES (p_user_id, 0, 0, 0, 0)
    ON CONFLICT (user_id) DO NOTHING;
  END IF;
  
  -- 获取用户可用积分
  SELECT available_points INTO v_available_points
  FROM public.user_points
  WHERE user_id = p_user_id;
  
  IF v_available_points IS NULL THEN
    v_available_points := 0;
  END IF;
  
  -- 获取用户总计已使用的免费次数
  SELECT COALESCE(SUM(free_uses), 0) INTO v_total_free_uses
  FROM public.user_usage
  WHERE user_id = p_user_id;
  
  -- 判断是否可以使用免费次数（总计10次）
  IF v_total_free_uses < v_total_free_limit THEN
    -- 使用免费次数
    INSERT INTO public.user_usage (
      user_id, 
      date, 
      free_uses, 
      free_uses_remaining, 
      images_generated
    )
    VALUES (
      p_user_id, 
      CURRENT_DATE, 
      1, 
      v_total_free_limit - v_total_free_uses - 1,
      1
    )
    ON CONFLICT (user_id, date) DO UPDATE
    SET 
      free_uses = user_usage.free_uses + 1,
      free_uses_remaining = v_total_free_limit - (v_total_free_uses + 1),
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
    INSERT INTO public.user_usage (
      user_id, 
      date, 
      points_consumed, 
      images_generated,
      free_uses_remaining
    )
    VALUES (
      p_user_id, 
      CURRENT_DATE, 
      v_points_per_generation, 
      1,
      0
    )
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

-- 授予必要的权限
GRANT EXECUTE ON FUNCTION public.consume_points_for_generation TO authenticated;
GRANT EXECUTE ON FUNCTION public.consume_points_for_generation TO anon;