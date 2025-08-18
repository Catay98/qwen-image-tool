import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// 获取所有订阅套餐
export async function GET(request: NextRequest) {
  try {
    const { data: plans, error } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('Error fetching plans:', error);
      return NextResponse.json(
        { error: 'Failed to fetch subscription plans' },
        { status: 500 }
      );
    }

    // 格式化套餐数据（现在字段已经是纯字符串）
    const formattedPlans = (plans || []).map(plan => ({
      id: plan.id,
      name: plan.display_name || plan.name,
      slug: String(plan.name || '').toLowerCase().replace(/\s+/g, '_'),
      description: plan.description || '',
      price: parseFloat(plan.price || 0),
      currency: 'USD',
      interval: plan.duration_type === 'month' ? 'month' : 'year',
      features: plan.features || [],
      limits: {
        points: plan.points,
        duration_type: plan.duration_type,
        duration_value: plan.duration_value
      },
      sortOrder: plan.sort_order,
      display_name: plan.display_name
    }));
    
    return NextResponse.json({ plans: formattedPlans });
  } catch (error) {
    console.error('Error in plans API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// 创建或更新订阅套餐（管理员功能）
export async function POST(request: NextRequest) {
  try {
    // 验证管理员权限（这里应该添加实际的权限验证）
    const adminAuth = request.headers.get('x-admin-auth');
    if (!adminAuth) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { name, slug, description, price, features, limits } = body;

    const { data, error } = await supabase
      .from('subscription_plans')
      .upsert({
        name,
        slug,
        description,
        price,
        features: { features },
        limits,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'slug'
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating/updating plan:', error);
      return NextResponse.json(
        { error: 'Failed to save plan' },
        { status: 500 }
      );
    }

    return NextResponse.json({ plan: data });
  } catch (error) {
    console.error('Error in plans POST:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}