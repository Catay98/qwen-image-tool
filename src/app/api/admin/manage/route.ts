import { NextResponse } from "next/server";
import { cookies } from "next/headers";

import crypto from 'crypto';
import { supabase } from '@/lib/supabase';

// MD5 hash函数
function md5(text: string): string {
  return crypto.createHash('md5').update(text).digest('hex');
}

// 获取所有管理员
export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get('admin-token');
  
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Using imported supabase client

  try {
    const { data: admins, error } = await supabase
      .from('admins')
      .select('id, username, email, is_active, created_at, last_login')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching admins:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ admins: admins || [] });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: "Failed to fetch admins" }, { status: 500 });
  }
}

// 创建新管理员
export async function POST(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get('admin-token');
  
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { username, password, email } = await request.json();

    if (!username || !password) {
      return NextResponse.json(
        { error: "Username and password are required" },
        { status: 400 }
      );
    }

    // Using imported supabase client

    // 检查用户名是否已存在
    const { data: existing } = await supabase
      .from('admins')
      .select('id')
      .eq('username', username)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: "Username already exists" },
        { status: 400 }
      );
    }

    // 创建新管理员
    const { data: newAdmin, error } = await supabase
      .from('admins')
      .insert({
        username,
        password_hash: md5(password),
        email: email || null,
        is_active: true
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating admin:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      admin: {
        id: newAdmin.id,
        username: newAdmin.username,
        email: newAdmin.email
      }
    });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: "Failed to create admin" }, { status: 500 });
  }
}

// 更新管理员（激活/停用）
export async function PUT(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get('admin-token');
  
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id, is_active, password } = await request.json();

    if (!id) {
      return NextResponse.json({ error: "Admin ID is required" }, { status: 400 });
    }

    // Using imported supabase client

    const updateData: { is_active: boolean; password_hash?: string } = { is_active };
    
    // 如果提供了新密码，更新密码
    if (password) {
      updateData.password_hash = md5(password);
    }

    const { error } = await supabase
      .from('admins')
      .update(updateData)
      .eq('id', id);

    if (error) {
      console.error('Error updating admin:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: "Failed to update admin" }, { status: 500 });
  }
}

// 删除管理员
export async function DELETE(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get('admin-token');
  
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await request.json();

    if (!id) {
      return NextResponse.json({ error: "Admin ID is required" }, { status: 400 });
    }

    // Using imported supabase client

    // 防止删除最后一个管理员
    const { count } = await supabase
      .from('admins')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true);

    if (count && count <= 1) {
      return NextResponse.json(
        { error: "Cannot delete the last active admin" },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('admins')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting admin:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: "Failed to delete admin" }, { status: 500 });
  }
}