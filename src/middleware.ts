import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // 检查是否是管理员路径
  if (request.nextUrl.pathname.startsWith('/admin')) {
    // 检查是否有管理员token
    const token = request.cookies.get('admin-token');
    
    if (!token) {
      // 没有token，重定向到新的登录页
      return NextResponse.redirect(new URL('/ydm/login', request.url));
    }
  }

  // 检查是否是新的管理入口
  if (request.nextUrl.pathname.startsWith('/ydm')) {
    // 排除登录页面
    if (request.nextUrl.pathname === '/ydm/login') {
      return NextResponse.next();
    }
    
    // 其他ydm路径重定向到admin
    const adminPath = request.nextUrl.pathname.replace('/ydm', '/admin');
    return NextResponse.redirect(new URL(adminPath, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/ydm/:path*'],
};