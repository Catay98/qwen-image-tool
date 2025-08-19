import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { supabase } from '@/lib/supabase';

export async function GET(request: Request) {
  // 验证管理员权限
  const cookieStore = await cookies();
  const token = cookieStore.get('admin-token');
  
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const userId = searchParams.get('userId');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const model = searchParams.get('model');
    
    // 构建查询
    let query = supabase
      .from('image_history')
      .select('*, users!image_history_user_id_fkey(email)', { count: 'exact' });
    
    // 添加过滤条件
    if (userId) {
      query = query.eq('user_id', userId);
    }
    if (dateFrom) {
      query = query.gte('created_at', dateFrom);
    }
    if (dateTo) {
      query = query.lte('created_at', dateTo);
    }
    if (model) {
      query = query.eq('model', model);
    }
    
    // 排序和分页
    query = query
      .order('created_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1);
    
    const { data: images, error, count } = await query;
    
    if (error) {
      console.error("Error fetching images:", error);
      return NextResponse.json({ 
        error: "Failed to fetch images",
        details: error.message 
      }, { status: 500 });
    }
    
    // 获取统计信息
    const statsQuery = supabase
      .from('image_history')
      .select('model, user_id');
    
    if (userId) statsQuery.eq('user_id', userId);
    if (dateFrom) statsQuery.gte('created_at', dateFrom);
    if (dateTo) statsQuery.lte('created_at', dateTo);
    
    const { data: statsData } = await statsQuery;
    
    // 计算统计
    const modelStats = new Map();
    const userStats = new Map();
    
    statsData?.forEach(img => {
      // 模型统计
      const modelCount = modelStats.get(img.model) || 0;
      modelStats.set(img.model, modelCount + 1);
      
      // 用户统计
      const userCount = userStats.get(img.user_id) || 0;
      userStats.set(img.user_id, userCount + 1);
    });
    
    // 获取今日统计
    const today = new Date().toISOString().split('T')[0];
    const { data: todayImages } = await supabase
      .from('image_history')
      .select('id')
      .gte('created_at', today);
    
    const stats = {
      total: count || 0,
      todayCount: todayImages?.length || 0,
      uniqueUsers: userStats.size,
      modelDistribution: Array.from(modelStats.entries()).map(([model, count]) => ({
        model,
        count
      })).sort((a, b) => b.count - a.count),
      topUsers: Array.from(userStats.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([userId, count]) => ({ userId, count }))
    };
    
    const totalPages = count ? Math.ceil(count / limit) : 0;
    
    return NextResponse.json({
      images: images || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages
      },
      stats,
      success: true
    });
    
  } catch (error) {
    console.error("Error in images API:", error);
    return NextResponse.json({ 
      error: "Failed to process request",
      details: error
    }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  // 验证管理员权限
  const cookieStore = await cookies();
  const token = cookieStore.get('admin-token');
  
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { ids } = await request.json();
    
    if (!ids || !Array.isArray(ids)) {
      return NextResponse.json(
        { error: "Invalid request, ids array required" },
        { status: 400 }
      );
    }
    
    // 批量删除
    const { error } = await supabase
      .from('image_history')
      .delete()
      .in('id', ids);

    if (error) {
      console.error("Error deleting images:", error);
      return NextResponse.json(
        { error: "Failed to delete images", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true,
      deletedCount: ids.length
    });
    
  } catch (error) {
    console.error("Error in delete API:", error);
    return NextResponse.json(
      { error: "Failed to process request", details: error },
      { status: 500 }
    );
  }
}