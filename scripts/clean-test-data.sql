-- 清理测试数据脚本
-- 请谨慎执行，确保只删除测试数据

-- 1. 清理测试用户的积分购买记录（基于测试用户ID）
DELETE FROM points_purchase_records 
WHERE user_id = '3306f2f7-88b6-4776-ba60-e41d89cfd7d6'
AND (
  package_name LIKE '%测试%' 
  OR package_name LIKE '%test%'
  OR transaction_id LIKE 'test_%'
  OR transaction_id LIKE 'pi_test_%'
  OR transaction_id LIKE 'cs_test_%'
);

-- 2. 清理包含测试标记的支付记录
DELETE FROM payment_records 
WHERE transaction_id LIKE 'test_%'
   OR transaction_id LIKE 'pi_test_%'
   OR transaction_id LIKE 'cs_test_%';

-- 3. 清理测试积分日志
DELETE FROM points_logs
WHERE user_id = '3306f2f7-88b6-4776-ba60-e41d89cfd7d6'
AND (
  reason LIKE '%测试%'
  OR reason LIKE '%test%'
  OR metadata::text LIKE '%test_%'
);

-- 4. 重置测试用户的积分（可选）
-- UPDATE user_points 
-- SET available_points = 0,
--     total_points = 0,
--     used_points = 0,
--     total_recharge = 0
-- WHERE user_id = '3306f2f7-88b6-4776-ba60-e41d89cfd7d6';

-- 5. 查看清理后的数据统计
SELECT 
  'points_purchase_records' as table_name, 
  COUNT(*) as record_count 
FROM points_purchase_records
WHERE user_id = '3306f2f7-88b6-4776-ba60-e41d89cfd7d6'

UNION ALL

SELECT 
  'payment_records' as table_name, 
  COUNT(*) as record_count 
FROM payment_records
WHERE user_id = '3306f2f7-88b6-4776-ba60-e41d89cfd7d6'

UNION ALL

SELECT 
  'points_logs' as table_name, 
  COUNT(*) as record_count 
FROM points_logs
WHERE user_id = '3306f2f7-88b6-4776-ba60-e41d89cfd7d6';

-- 提示：执行前请确认用户ID是否正确，避免误删生产数据