-- 添加取消订阅相关字段
ALTER TABLE public.subscriptions 
ADD COLUMN IF NOT EXISTS cancel_at_period_end BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMP WITH TIME ZONE;

-- 添加注释
COMMENT ON COLUMN public.subscriptions.cancel_at_period_end IS '是否在期末取消（类似视频会员的取消续费）';
COMMENT ON COLUMN public.subscriptions.cancelled_at IS '取消订阅的时间';

-- 更新现有的 cancelled 状态记录
UPDATE public.subscriptions 
SET cancel_at_period_end = true 
WHERE status = 'cancelled' AND end_date > NOW();

-- 更新已过期的订阅
UPDATE public.subscriptions 
SET status = 'expired' 
WHERE status = 'active' AND end_date < NOW();