-- 修复 points_purchase_records 表结构
-- 添加缺失的列

-- 检查并添加 bonus_points 列
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'points_purchase_records' 
    AND column_name = 'bonus_points'
  ) THEN
    ALTER TABLE points_purchase_records 
    ADD COLUMN bonus_points INTEGER DEFAULT 0;
  END IF;
END $$;

-- 检查并添加 total_points 列
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'points_purchase_records' 
    AND column_name = 'total_points'
  ) THEN
    ALTER TABLE points_purchase_records 
    ADD COLUMN total_points INTEGER;
  END IF;
END $$;

-- 检查并添加 package_id 列
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'points_purchase_records' 
    AND column_name = 'package_id'
  ) THEN
    ALTER TABLE points_purchase_records 
    ADD COLUMN package_id UUID REFERENCES points_packages(id);
  END IF;
END $$;

-- 检查并添加 payment_details 列
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'points_purchase_records' 
    AND column_name = 'payment_details'
  ) THEN
    ALTER TABLE points_purchase_records 
    ADD COLUMN payment_details JSONB;
  END IF;
END $$;

-- 修改 points 列允许为空（如果需要）
ALTER TABLE points_purchase_records 
ALTER COLUMN points DROP NOT NULL;

-- 更新现有记录的 total_points（如果为空）
UPDATE points_purchase_records 
SET total_points = points 
WHERE total_points IS NULL;