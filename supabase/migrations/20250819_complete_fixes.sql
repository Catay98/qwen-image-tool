-- 完整的数据库修复和优化脚本
-- 包含积分购买记录修复、积分过期功能、约束优化

-- 1. 修复 points_purchase_records 表
-- 添加缺失的列
ALTER TABLE points_purchase_records 
ADD COLUMN IF NOT EXISTS bonus_points INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_points INTEGER,
ADD COLUMN IF NOT EXISTS transaction_id TEXT;

-- 修改 payment_status 约束
ALTER TABLE points_purchase_records 
DROP CONSTRAINT IF EXISTS points_purchase_records_payment_status_check;

ALTER TABLE points_purchase_records 
ADD CONSTRAINT points_purchase_records_payment_status_check 
CHECK (payment_status IN ('pending', 'completed', 'failed', 'success', 'paid'));

-- 2. 添加积分过期相关功能
-- 添加过期处理标记
ALTER TABLE points_purchase_records 
ADD COLUMN IF NOT EXISTS expired_processed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS expired_at TIMESTAMP WITH TIME ZONE;

-- 添加索引以提高查询效率
CREATE INDEX IF NOT EXISTS idx_points_purchase_expire 
ON points_purchase_records(user_id, expire_at, payment_status, expired_processed);

-- 3. 更新 points_logs 表约束
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'points_logs_change_type_check'
  ) THEN
    ALTER TABLE points_logs 
    DROP CONSTRAINT points_logs_change_type_check;
  END IF;
  
  ALTER TABLE points_logs 
  ADD CONSTRAINT points_logs_change_type_check 
  CHECK (change_type IN ('recharge', 'consume', 'refund', 'reward', 'expire', 'manual'));
END $$;

-- 4. 创建自动处理过期积分的函数
CREATE OR REPLACE FUNCTION check_expired_points()
RETURNS void AS $$
DECLARE
  expired_record RECORD;
  current_points RECORD;
BEGIN
  FOR expired_record IN 
    SELECT user_id, SUM(COALESCE(total_points, points, 0)) as expired_points
    FROM points_purchase_records
    WHERE expire_at < NOW()
      AND payment_status = 'completed'
      AND (expired_processed IS NULL OR expired_processed = false)
    GROUP BY user_id
  LOOP
    SELECT * INTO current_points
    FROM user_points
    WHERE user_id = expired_record.user_id;
    
    IF current_points IS NOT NULL THEN
      UPDATE user_points
      SET available_points = GREATEST(0, available_points - expired_record.expired_points),
          updated_at = NOW()
      WHERE user_id = expired_record.user_id;
      
      UPDATE points_purchase_records
      SET expired_processed = true,
          expired_at = NOW()
      WHERE user_id = expired_record.user_id
        AND expire_at < NOW()
        AND payment_status = 'completed'
        AND (expired_processed IS NULL OR expired_processed = false);
      
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