import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get('admin-token');
  
  if (token) {
    return NextResponse.json({ 
      success: true, 
      authenticated: true 
    });
  } else {
    return NextResponse.json({ 
      success: false, 
      authenticated: false 
    }, { status: 401 });
  }
}