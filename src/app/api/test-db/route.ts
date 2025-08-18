import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    // 测试数据库连接
    console.log('Testing database connection...');
    console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
    
    // 测试1：检查管理员表
    const { data: admins, error: adminsError } = await supabase
      .from('admins')
      .select('username, is_active')
      .limit(1);
    
    // 测试2：检查订阅计划表
    const { data: plans, error: plansError } = await supabase
      .from('subscription_plans')
      .select('name, price, points')
      .eq('is_active', true);
    
    // 测试3：检查积分包表
    const { data: packages, error: packagesError } = await supabase
      .from('points_packages')
      .select('name, points, price')
      .eq('is_active', true);
    
    return NextResponse.json({
      success: true,
      database_url: process.env.NEXT_PUBLIC_SUPABASE_URL?.split('.')[0],
      tests: {
        admins: {
          success: !adminsError,
          count: admins?.length || 0,
          error: adminsError?.message,
          data: admins
        },
        subscription_plans: {
          success: !plansError,
          count: plans?.length || 0,
          error: plansError?.message,
          data: plans
        },
        points_packages: {
          success: !packagesError,
          count: packages?.length || 0,
          error: packagesError?.message,
          data: packages
        }
      },
      message: '请检查上述表是否存在数据。如果为空，请在Supabase中执行 init_database.sql 脚本。'
    });
  } catch (error) {
    console.error('Database test error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: '数据库连接失败，请检查配置'
    }, { status: 500 });
  }
}