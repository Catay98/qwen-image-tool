import { NextResponse } from "next/server";

export async function POST() {
  const response = NextResponse.json({ 
    success: true, 
    message: "退出成功" 
  });
  
  // 清除cookie
  response.cookies.delete('admin-token');
  
  return response;
}