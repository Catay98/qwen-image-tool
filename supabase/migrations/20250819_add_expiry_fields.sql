-- 添加积分过期处理相关字段

-- 1. 在 points_purchase_records 表添加过期处理标记
ALTER TABLE points_purchase_records 
ADD COLUMN IF NOT EXISTS expired_processed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS expired_at TIMESTAMP WITH TIME ZONE;

-- 2. 添加索引以提高查询效率
CREATE INDEX IF NOT EXISTS idx_points_purchase_expire 
ON points_purchase_records(user_id, expire_at, payment_status, expired_processed);

-- 3. 为 points_logs 表添加 'expire' 类型（如果需要）
DO $$ 
BEGIN
  -- 检查约束是否存在
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'points_logs_change_type_check'
  ) THEN
    ALTER TABLE points_logs 
    DROP CONSTRAINT points_logs_change_type_check;
  END IF;
  
  -- 添加新的约束，包含 'expire' 类型
  ALTER TABLE points_logs 
  ADD CONSTRAINT points_logs_change_type_check 
  CHECK (change_type IN ('recharge', 'consume', 'refund', 'reward', 'expire', 'manual'));
END $$;

-- 4. 创建一个函数来自动处理过期积分（可选）
CREATE OR REPLACE FUNCTION check_expired_points()
RETURNS void AS $$
DECLARE
  expired_record RECORD;
  total_expired_points INTEGER;
  current_points RECORD;
BEGIN
  -- 遍历所有用户
  FOR expired_record IN 
    SELECT user_id, SUM(COALESCE(total_points, points, 0)) as expired_points
    FROM points_purchase_records
    WHERE expire_at < NOW()
      AND payment_status = 'completed'
      AND (expired_processed IS NULL OR expired_processed = false)
    GROUP BY user_id
  LOOP
    -- 获取用户当前积分
    SELECT * INTO current_points
    FROM user_points
    WHERE user_id = expired_record.user_id;
    
    IF current_points IS NOT NULL THEN
      -- 更新用户积分
      UPDATE user_points
      SET available_points = GREATEST(0, available_points - expired_record.expired_points),
          updated_at = NOW()
      WHERE user_id = expired_record.user_id;
      
      -- 标记记录为已处理
      UPDATE points_purchase_records
      SET expired_processed = true,
          expired_at = NOW()
      WHERE user_id = expired_record.user_id
        AND expire_at < NOW()
        AND payment_status = 'completed'
        AND (expired_processed IS NULL OR expired_processed = false);
      
      -- 记录日志
      INSERT INTO points_logs (user_id, points_change, change_type, reason, balance_after, metadata)
      VALUES (
        expired_record.user_id,
        -expired_record.expired_points,
        'expire',
        '积分包到期自动清理',
        GREATEST(0, current_points.available_points - expired_record.expired_points),
        jsonb_build_object('auto_processed', true, 'expired_points', expired_record.expired_points)
      );
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- 5. 创建定时任务（需要pg_cron扩展，可选）
-- 如果有pg_cron扩展，可以创建定时任务每天执行一次
-- SELECT cron.schedule('check-expired-points', '0 2 * * *', 'SELECT check_expired_points();');

-- 6. 立即执行一次检查（可选）
-- SELECT check_expired_points();