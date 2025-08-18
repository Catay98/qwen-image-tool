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

  // 创建新的supabase客户端
  // Using imported supabase client

  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12');
    const offset = (page - 1) * limit;

    // 获取所有数据来计算总数
    const { data: allImages, error: countError } = await supabase
      .from('image_history')
      .select('*')
      .order('created_at', { ascending: false });
    
    const count = allImages ? allImages.length : 0;
    
    // 手动分页
    const images = allImages ? allImages.slice(offset, offset + limit) : [];

    if (countError) {
      console.error("Error fetching images:", countError);
      return NextResponse.json({ 
        images: [], 
        total: 0, 
        page, 
        totalPages: 0 
      });
    }

    const totalPages = count ? Math.ceil(count / limit) : 0;

    return NextResponse.json({
      images: images || [],
      total: count || 0,
      page,
      totalPages
    });
  } catch (error) {
    console.error("Error in images API:", error);
    return NextResponse.json({ 
      images: [], 
      total: 0, 
      page: 1, 
      totalPages: 0 
    });
  }
}

export async function DELETE(request: Request) {
  // 验证管理员权限
  const cookieStore = await cookies();
  const token = cookieStore.get('admin-token');
  
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 创建新的supabase客户端
  // Using imported supabase client

  try {
    const { id } = await request.json();
    
    const { error } = await supabase
      .from('image_history')
      .delete()
      .eq('id', id);

    if (error) {
      console.error("Error deleting image:", error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in delete API:", error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}