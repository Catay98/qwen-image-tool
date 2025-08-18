// Stripe配置文件
// 在生产环境中，这些配置应该从环境变量中读取

export const stripeConfig = {
  publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '',
  secretKey: process.env.STRIPE_SECRET_KEY || '',
  webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
  currency: 'usd',
  successUrl: '/admin/billing?success=true',
  cancelUrl: '/admin/billing?canceled=true'
};

// 产品定价配置
export const pricingPlans = {
  basic: {
    id: 'basic_plan',
    name: '基础版',
    description: '适合个人用户',
    price: 4.99,
    currency: 'USD',
    interval: 'month',
    features: [
      '每月100次图片生成',
      '基础模板',
      '标准处理速度',
      '邮件支持'
    ],
    limits: {
      daily: 20,
      monthly: 100
    }
  },
  pro: {
    id: 'pro_plan',
    name: '专业版',
    description: '适合专业用户',
    price: 9.99,
    currency: 'USD',
    interval: 'month',
    features: [
      '每月500次图片生成',
      '高级模板',
      '优先处理',
      '24小时客服支持',
      '批量处理'
    ],
    limits: {
      daily: 100,
      monthly: 500
    }
  },
  premium: {
    id: 'premium_plan',
    name: '高级版',
    description: '无限制使用',
    price: 19.99,
    currency: 'USD',
    interval: 'month',
    features: [
      '无限次图片生成',
      '所有模板',
      '最高优先级',
      '专属客服',
      'API访问',
      '自定义模板'
    ],
    limits: {
      daily: -1, // 无限制
      monthly: -1
    }
  }
};

// 检查Stripe是否配置
export function isStripeConfigured(): boolean {
  return !!(stripeConfig.publishableKey && stripeConfig.secretKey);
}

// 获取价格显示格式
export function formatPrice(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency: currency
  }).format(amount);
}