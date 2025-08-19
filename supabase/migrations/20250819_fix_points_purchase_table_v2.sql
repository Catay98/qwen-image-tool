-- 修复 points_purchase_records 表的约束和列问题

-- 1. 修改 payment_status 约束，允许更多值
ALTER TABLE points_purchase_records 
DROP CONSTRAINT IF EXISTS points_purchase_records_payment_status_check;

ALTER TABLE points_purchase_records 
ADD CONSTRAINT points_purchase_records_payment_status_check 
CHECK (payment_status IN ('pending', 'completed', 'failed', 'success', 'paid'));

-- 2. 添加 transaction_id 列（如果不存在）
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'points_purchase_records' 
    AND column_name = 'transaction_id'
  ) THEN
    ALTER TABLE points_purchase_records 
    ADD COLUMN transaction_id TEXT;
  END IF;
END $$;

-- 3. 更新所有 pending 状态为 completed（如果需要）
-- UPDATE points_purchase_records 
-- SET payment_status = 'completed' 
-- WHERE payment_status = 'pending' 
-- AND created_at < NOW() - INTERVAL '1 hour';