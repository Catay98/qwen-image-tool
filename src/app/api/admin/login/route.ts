import { NextResponse } from "next/server";
import crypto from 'crypto';

import { supabase } from '@/lib/supabase';

// 生成简单的token（生产环境应使用JWT）
function generateToken() {
  return crypto.randomBytes(32).toString('hex');
}

// 简单的MD5 hash函数（生产环境应使用bcrypt）
function md5(text: string): string {
  return crypto.createHash('md5').update(text).digest('hex');
}

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json(
        { success: false, message: "请输入用户名和密码" },
        { status: 400 }
      );
    }

    // 创建Supabase客户端
    // Using imported supabase client

    // 查询管理员表
    console.log('Attempting login for username:', username);
    
    // 先检查表是否存在和是否有数据
    const { data: allAdmins, error: checkError } = await supabase
      .from('admins')
      .select('username, is_active');
    
    console.log('All admins in database:', allAdmins);
    console.log('Check error:', checkError);
    
    // 如果表不存在或没有数据，返回详细错误
    if (checkError || !allAdmins || allAdmins.length === 0) {
      console.log('Database not initialized, returning error');
      return NextResponse.json(
        { 
          success: false, 
          message: "数据库未初始化，请先执行 init_database.sql 脚本", 
          error: checkError?.message,
          hint: "请在Supabase SQL编辑器中执行 supabase/init_database.sql 文件"
        },
        { status: 401 }
      );
    }

    // 查询特定用户
    const { data: admin, error } = await supabase
      .from('admins')
      .select('*')
      .eq('username', username)
      .eq('is_active', true)
      .single();

    console.log('Admin query result:', { admin, error });
    console.log('Query details:', {
      searchingFor: username,
      foundAdmin: admin?.username,
      isActive: admin?.is_active,
      hasPasswordHash: !!admin?.password_hash
    });

    if (error || !admin) {
      // 如果是表不存在的错误，返回特定消息
      if (error?.message?.includes('relation') || error?.message?.includes('does not exist')) {
        return NextResponse.json(
          { success: false, message: "管理员表未创建，请先执行SQL脚本" },
          { status: 500 }
        );
      }
      
      return NextResponse.json(
        { success: false, message: "用户名或密码错误" },
        { status: 401 }
      );
    }

    // 验证密码（使用MD5，生产环境应使用bcrypt）
    // 新数据库中 admin 的密码是 admin123，MD5: 0192023a7bbd73250516f069df18b500
    const passwordHash = md5(password);
    console.log('Password verification:', {
      inputPassword: password,
      inputHash: passwordHash,
      storedHash: admin.password_hash,
      match: admin.password_hash === passwordHash
    });
    
    if (admin.password_hash !== passwordHash) {
      return NextResponse.json(
        { success: false, message: "用户名或密码错误" },
        { status: 401 }
      );
    }

    // 更新最后登录时间
    await supabase
      .from('admins')
      .update({ last_login: new Date().toISOString() })
      .eq('id', admin.id);

    // 生成token
    const token = generateToken();
    
    // 设置cookie
    const response = NextResponse.json({ 
      success: true, 
      message: "登录成功",
      token: token,
      username: admin.username
    });
    
    response.cookies.set('admin-token', token, {
      path: '/',
      maxAge: 60 * 60 * 24, // 24小时
      sameSite: 'lax'
    });

    // 存储admin信息到cookie（可选）
    response.cookies.set('admin-user', admin.username, {
      path: '/',
      maxAge: 60 * 60 * 24,
      sameSite: 'lax'
    });
    
    return response;
  } catch (error) {
    console.error("Admin login error:", error);
    return NextResponse.json(
      { success: false, message: "登录失败" },
      { status: 500 }
    );
  }
}