import { NextResponse } from "next/server";
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function POST() {
  try {
    // 生成测试数据（根据image_history表结构）
    const testData = {
      user_id: null, // 允许为null，因为没有实际用户
      prompt: 'Test database write functionality',
      image_url: 'https://example.com/test-image.png',
      model: 'qwen-vl-max-latest',
      size: '1024x1024',
      points_consumed: 10,
      metadata: {},
      created_at: new Date().toISOString()
    };

    // 测试写入到image_history表（根据错误提示，应该是这个表）
    const { data, error } = await supabaseAdmin
      .from('image_history')
      .insert([testData])
      .select()
      .single();

    if (error) {
      return NextResponse.json({
        success: false,
        canWrite: false,
        error: error.message,
        details: error
      });
    }

    // 测试删除刚刚插入的数据
    const { error: deleteError } = await supabaseAdmin
      .from('image_history')
      .delete()
      .eq('id', data.id);

    return NextResponse.json({
      success: true,
      canWrite: true,
      message: '数据库写入测试成功',
      testData: data,
      cleanupSuccess: !deleteError,
      cleanupError: deleteError?.message
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      canWrite: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET() {
  try {
    // 测试读取数据
    const { data: tables, error: tablesError } = await supabaseAdmin
      .from('image_history')
      .select('id')
      .limit(1);

    const { data: count, error: countError } = await supabaseAdmin
      .from('image_history')
      .select('*', { count: 'exact', head: true });

    return NextResponse.json({
      success: true,
      canRead: !tablesError,
      totalRecords: count,
      readError: tablesError?.message,
      countError: countError?.message,
      databaseStatus: !tablesError ? '数据库连接正常' : '数据库连接异常'
    });
    
  } catch (error) {
    return NextResponse.json({
      success: false,
      canRead: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}