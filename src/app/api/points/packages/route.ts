import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { data: packages, error } = await supabase
      .from('points_packages')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('Error fetching points packages:', error);
      return NextResponse.json(
        { error: 'Failed to fetch points packages' },
        { status: 500 }
      );
    }

    // 格式化积分包数据（现在字段已经是纯字符串）
    const formattedPackages = (packages || []).map(pkg => ({
      id: pkg.id,
      name: pkg.display_name || pkg.name,
      points: pkg.points,
      price: parseFloat(pkg.price),
      bonus_points: 0,
      currency: 'USD',
      description: pkg.description || '',
      popular: pkg.sort_order === 1,
      validity_days: pkg.validity_days || 60,
      display_name: pkg.display_name,
      features: pkg.features || []
    }));
    
    return NextResponse.json({ packages: formattedPackages });
  } catch (error) {
    console.error('Error in points packages API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}