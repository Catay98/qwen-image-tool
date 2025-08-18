import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    // 获取所有激活的订阅计划
    const { data, error } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('Error fetching plans:', error);
      return NextResponse.json({ error: 'Failed to fetch plans' }, { status: 500 });
    }

    // 直接返回数据（现在是纯字符串）
    return NextResponse.json(data || []);
  } catch (error) {
    console.error('Plans fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// 管理员更新价格
export async function PUT(request: Request) {
  try {
    const { planId, price } = await request.json();
    
    if (!planId || price === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Using imported supabase client
    
    const { data, error } = await supabase
      .from('subscription_plans')
      .update({ price, updated_at: new Date().toISOString() })
      .eq('id', planId)
      .select()
      .single();

    if (error) {
      console.error('Error updating plan:', error);
      return NextResponse.json({ error: 'Failed to update plan' }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Plan update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}