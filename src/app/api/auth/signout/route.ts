import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    // 清除所有cookie
    const response = NextResponse.json({ success: true });
    
    // 清除Supabase相关的cookies
    response.cookies.delete('sb-access-token');
    response.cookies.delete('sb-refresh-token');
    response.cookies.delete('sb-auth-token');
    
    // 清除所有可能的Supabase cookie（不同版本可能使用不同的名称）
    const cookieNames = request.cookies.getAll();
    cookieNames.forEach(cookie => {
      if (cookie.name.includes('sb-') || cookie.name.includes('supabase')) {
        response.cookies.delete(cookie.name);
      }
    });
    
    return response;
  } catch (error) {
    console.error('Signout API error:', error);
    // 即使出错也返回成功，确保用户能退出
    return NextResponse.json({ success: true });
  }
}

export async function GET(request: NextRequest) {
  // 也支持GET请求
  return POST(request);
}