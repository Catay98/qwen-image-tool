import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// 初始化订阅套餐
export async function POST(request: NextRequest) {
  try {
    // 验证管理员权限
    const response = await fetch(`${request.nextUrl.origin}/api/admin/verify`, {
      headers: request.headers
    });
    
    if (!response.ok) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 默认套餐数据
    const plans = [
      {
        name: '基础版',
        slug: 'basic',
        description: '适合个人用户',
        price: 4.99,
        currency: 'USD',
        interval: 'month',
        features: {
          features: [
            '每月100次图片生成',
            '基础模板',
            '标准处理速度',
            '邮件支持'
          ]
        },
        limits: {
          daily: 20,
          monthly: 100
        },
        sort_order: 1,
        is_active: true
      },
      {
        name: '专业版',
        slug: 'pro',
        description: '适合专业用户',
        price: 9.99,
        currency: 'USD',
        interval: 'month',
        features: {
          features: [
            '每月500次图片生成',
            '高级模板',
            '优先处理',
            '24小时客服支持',
            '批量处理'
          ]
        },
        limits: {
          daily: 100,
          monthly: 500
        },
        sort_order: 2,
        is_active: true
      },
      {
        name: '高级版',
        slug: 'premium',
        description: '无限制使用',
        price: 19.99,
        currency: 'USD',
        interval: 'month',
        features: {
          features: [
            '无限次图片生成',
            '所有模板',
            '最高优先级',
            '专属客服',
            'API访问',
            '自定义模板'
          ]
        },
        limits: {
          daily: -1,
          monthly: -1
        },
        sort_order: 3,
        is_active: true
      }
    ];

    // 插入或更新套餐
    for (const plan of plans) {
      const { error } = await supabase
        .from('subscription_plans')
        .upsert(plan, {
          onConflict: 'slug'
        });

      if (error) {
        console.error(`Error inserting plan ${plan.slug}:`, error);
      }
    }

    return NextResponse.json({
      success: true,
      message: '套餐初始化成功',
      plans: plans.map(p => ({ name: p.name, slug: p.slug, price: p.price }))
    });
  } catch (error) {
    console.error('Error initializing plans:', error);
    return NextResponse.json(
      { error: '初始化失败' },
      { status: 500 }
    );
  }
}

// 获取所有套餐（测试用）
export async function GET(request: NextRequest) {
  try {
    const { data: plans, error } = await supabase
      .from('subscription_plans')
      .select('*')
      .order('sort_order');

    if (error) {
      return NextResponse.json(
        { error: '获取套餐失败' },
        { status: 500 }
      );
    }

    return NextResponse.json({ plans });
  } catch (error) {
    console.error('Error fetching plans:', error);
    return NextResponse.json(
      { error: '服务器错误' },
      { status: 500 }
    );
  }
}