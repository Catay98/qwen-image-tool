import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // 检查是否是管理员路径
  if (request.nextUrl.pathname.startsWith('/admin')) {
    // 排除登录页面
    if (request.nextUrl.pathname === '/admin/login') {
      return NextResponse.next();
    }

    // 检查是否有管理员token
    const token = request.cookies.get('admin-token');
    
    if (!token) {
      // 没有token，重定向到登录页
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/admin/:path*',
};