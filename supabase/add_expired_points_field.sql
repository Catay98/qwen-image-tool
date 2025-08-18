-- 添加过期积分字段
ALTER TABLE public.user_points 
ADD COLUMN IF NOT EXISTS expired_points INTEGER DEFAULT 0;

-- 添加注释
COMMENT ON COLUMN public.user_points.expired_points IS '订阅过期时清零的积分总数';

-- 创建定期检查过期订阅的函数
CREATE OR REPLACE FUNCTION check_expired_subscriptions()
RETURNS void AS $$
DECLARE
  sub RECORD;
  user_points_record RECORD;
BEGIN
  -- 查找所有已过期但状态仍为active的订阅
  FOR sub IN
    SELECT * FROM subscriptions 
    WHERE status = 'active' 
    AND end_date < NOW()
  LOOP
    -- 更新订阅状态为expired
    UPDATE subscriptions 
    SET status = 'expired', 
        updated_at = NOW()
    WHERE id = sub.id;
    
    -- 获取用户当前积分
    SELECT * INTO user_points_record 
    FROM user_points 
    WHERE user_id = sub.user_id;
    
    -- 如果用户有积分，清零并记录
    IF user_points_record.available_points > 0 THEN
      -- 记录积分过期交易
      INSERT INTO points_transactions (
        user_id,
        amount,
        type,
        description,
        balance_after,
        created_at
      ) VALUES (
        sub.user_id,
        -user_points_record.available_points,
        'expired',
        '订阅到期，积分清零',
        0,
        NOW()
      );
      
      -- 更新用户积分
      UPDATE user_points 
      SET available_points = 0,
          expired_points = COALESCE(expired_points, 0) + user_points_record.available_points,
          updated_at = NOW()
      WHERE user_id = sub.user_id;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- 添加注释
COMMENT ON FUNCTION check_expired_subscriptions() IS '检查并处理过期订阅，清零相关积分';