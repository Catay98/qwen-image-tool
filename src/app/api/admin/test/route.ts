import { NextResponse } from "next/server";

import { supabase } from '@/lib/supabase';
import crypto from 'crypto';

function md5(text: string): string {
  return crypto.createHash('md5').update(text).digest('hex');
}

export async function GET() {
  try {
    // Using imported supabase client
    
    // 查询所有管理员
    const { data: admins, error } = await supabase
      .from('admins')
      .select('*');
    
    const expectedHash = md5('admin');
    
    return NextResponse.json({
      success: true,
      supabaseUrl: SUPABASE_URL,
      hasKey: !!SUPABASE_ANON_KEY,
      expectedHashForAdmin: expectedHash,
      adminsInDatabase: admins?.map(admin => ({
        username: admin.username,
        passwordHash: admin.password_hash,
        isActive: admin.is_active,
        hashMatches: admin.password_hash === expectedHash
      })),
      error: error?.message,
      totalAdmins: admins?.length || 0
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}