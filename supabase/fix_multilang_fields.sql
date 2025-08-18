-- ================================================
-- 修复多语言字段问题
-- 将 JSONB 多语言字段转换为纯字符串
-- ================================================

-- 1. 修改 subscription_plans 表
-- 先添加新的字符串列
ALTER TABLE public.subscription_plans 
ADD COLUMN IF NOT EXISTS display_name_zh VARCHAR(255),
ADD COLUMN IF NOT EXISTS description_zh TEXT;

-- 从 JSONB 中提取中文值到新列
UPDATE public.subscription_plans 
SET display_name_zh = COALESCE(
  display_name->>'zh', 
  display_name->>'en',
  name
),
description_zh = COALESCE(
  description->>'zh',
  description->>'en',
  ''
);

-- 删除旧的 JSONB 列
ALTER TABLE public.subscription_plans 
DROP COLUMN IF EXISTS display_name,
DROP COLUMN IF EXISTS description;

-- 重命名新列
ALTER TABLE public.subscription_plans 
RENAME COLUMN display_name_zh TO display_name;
ALTER TABLE public.subscription_plans 
RENAME COLUMN description_zh TO description;

-- 2. 修改 points_packages 表
-- 先添加新的字符串列
ALTER TABLE public.points_packages 
ADD COLUMN IF NOT EXISTS display_name_zh VARCHAR(255),
ADD COLUMN IF NOT EXISTS description_zh TEXT;

-- 从 JSONB 中提取中文值到新列
UPDATE public.points_packages 
SET display_name_zh = COALESCE(
  display_name->>'zh',
  display_name->>'en', 
  name
),
description_zh = COALESCE(
  description->>'zh',
  description->>'en',
  ''
);

-- 删除旧的 JSONB 列
ALTER TABLE public.points_packages 
DROP COLUMN IF EXISTS display_name,
DROP COLUMN IF EXISTS description;

-- 重命名新列
ALTER TABLE public.points_packages 
RENAME COLUMN display_name_zh TO display_name;
ALTER TABLE public.points_packages 
RENAME COLUMN description_zh TO description;

-- 3. 更新现有数据为中文
UPDATE public.subscription_plans
SET display_name = CASE
  WHEN name = 'monthly_subscription' THEN '月度订阅'
  WHEN name = 'yearly_subscription' THEN '年度订阅'
  ELSE display_name
END,
description = CASE
  WHEN name = 'monthly_subscription' THEN '每月680积分，适合经常使用的用户'
  WHEN name = 'yearly_subscription' THEN '每年8000积分，最划算的选择'
  ELSE description
END
WHERE display_name IS NULL OR display_name = '';

UPDATE public.points_packages
SET display_name = CASE
  WHEN name = 'points_300' THEN '300积分包'
  WHEN name = 'points_700' THEN '700积分包'
  ELSE display_name
END,
description = CASE
  WHEN name = 'points_300' THEN '适合轻度使用，可生成30张图片'
  WHEN name = 'points_700' THEN '适合重度使用，可生成70张图片'
  ELSE description
END
WHERE display_name IS NULL OR display_name = '';

-- 4. 修改 features 字段（如果需要）
-- 将 features 从 JSONB 数组改为文本数组
ALTER TABLE public.subscription_plans
ADD COLUMN IF NOT EXISTS features_text TEXT[];

UPDATE public.subscription_plans
SET features_text = ARRAY[
  '高清图片生成',
  '优先处理队列',
  '批量生成功能',
  '历史记录保存'
]
WHERE features_text IS NULL;

ALTER TABLE public.subscription_plans
DROP COLUMN IF EXISTS features;

ALTER TABLE public.subscription_plans
RENAME COLUMN features_text TO features;

-- 5. 同样处理 points_packages 的 features（如果有）
ALTER TABLE public.points_packages
ADD COLUMN IF NOT EXISTS features_text TEXT[];

UPDATE public.points_packages
SET features_text = ARRAY[
  '高清图片生成',
  '灵活使用',
  '批量优惠'
]
WHERE features_text IS NULL;

ALTER TABLE public.points_packages
DROP COLUMN IF EXISTS features CASCADE;

ALTER TABLE public.points_packages
RENAME COLUMN features_text TO features;

-- 6. 验证修改结果
SELECT 
  name,
  display_name,
  description,
  price,
  points
FROM public.subscription_plans;

SELECT
  name,
  display_name,
  description,
  price,
  points
FROM public.points_packages;