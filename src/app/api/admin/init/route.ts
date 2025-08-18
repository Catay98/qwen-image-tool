import { NextResponse } from "next/server";

import crypto from "crypto";
import { supabase } from '@/lib/supabase';

// MD5 hash函数
function md5(text: string): string {
  return crypto.createHash("md5").update(text).digest("hex");
}

// 初始化管理员表和默认账号
export async function GET() {
  // 验证环境变量
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return NextResponse.json({
      success: false,
      error: "Configuration error",
      message: "Supabase配置缺失，请检查环境变量",
      sql: `
-- 创建管理员表
CREATE TABLE IF NOT EXISTS public.admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  email TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login TIMESTAMP WITH TIME ZONE
);

-- 禁用RLS
ALTER TABLE public.admins DISABLE ROW LEVEL SECURITY;

-- 插入默认管理员
INSERT INTO public.admins (username, password_hash, email, is_active)
VALUES ('admin', '${md5("admin")}', 'admin@example.com', true)
ON CONFLICT (username) DO NOTHING;
      `,
    });
  }

  // Using imported supabase client

  try {
    // 尝试创建默认管理员账号
    const defaultAdmin = {
      username: "admin",
      password_hash: md5("admin"), // 密码: admin
      email: "admin@example.com",
      is_active: true,
    };

    console.log(
      "Creating default admin with hash:",
      defaultAdmin.password_hash
    );
    console.log(
      'Expected hash for "admin":',
      "21232f297a57a5a743894a0e4a801fc3"
    );

    // 先检查是否已存在
    const { data: existing, error: checkError } = await supabase
      .from("admins")
      .select("username")
      .eq("username", "admin")
      .single();

    if (checkError && !checkError.message.includes("No rows")) {
      console.log("Check error:", checkError);

      // 如果有任何数据库错误，返回SQL脚本
      return NextResponse.json({
        success: false,
        error: checkError.message,
        message: "数据库操作失败，请在Supabase SQL Editor中执行以下脚本",
        sql: `
-- 创建管理员表
CREATE TABLE IF NOT EXISTS public.admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  email TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login TIMESTAMP WITH TIME ZONE
);

-- 禁用RLS
ALTER TABLE public.admins DISABLE ROW LEVEL SECURITY;

-- 插入默认管理员
INSERT INTO public.admins (username, password_hash, email, is_active)
VALUES ('admin', '${md5("admin")}', 'admin@example.com', true)
ON CONFLICT (username) DO NOTHING;
          `,
      });
    }

    if (existing) {
      // 如果已存在，更新密码
      const { error: updateError } = await supabase
        .from("admins")
        .update({
          password_hash: defaultAdmin.password_hash,
          is_active: true,
        })
        .eq("username", "admin");

      if (updateError) {
        console.log("Update error:", updateError);
        return NextResponse.json({
          success: false,
          error: updateError.message,
          message: "更新管理员失败，请在Supabase SQL Editor中执行以下脚本",
          sql: `
-- 创建管理员表
CREATE TABLE IF NOT EXISTS public.admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  email TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login TIMESTAMP WITH TIME ZONE
);

-- 禁用RLS
ALTER TABLE public.admins DISABLE ROW LEVEL SECURITY;

-- 插入默认管理员
INSERT INTO public.admins (username, password_hash, email, is_active)
VALUES ('admin', '${md5("admin")}', 'admin@example.com', true)
ON CONFLICT (username) DO NOTHING;
          `,
        });
      }

      return NextResponse.json({
        success: true,
        message: "管理员账号已重置",
        credentials: {
          username: "admin",
          password: "admin",
        },
      });
    } else {
      // 创建新管理员
      const { data: newAdmin, error: insertError } = await supabase
        .from("admins")
        .insert(defaultAdmin)
        .select()
        .single();

      if (insertError) {
        console.log("Insert error:", insertError);
        // 如果插入失败，返回SQL脚本
        return NextResponse.json({
          success: false,
          error: insertError.message,
          message: "创建管理员失败，请在Supabase SQL Editor中执行以下脚本",
          sql: `
-- 创建管理员表
CREATE TABLE IF NOT EXISTS public.admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  email TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login TIMESTAMP WITH TIME ZONE
);

-- 禁用RLS
ALTER TABLE public.admins DISABLE ROW LEVEL SECURITY;

-- 插入默认管理员
INSERT INTO public.admins (username, password_hash, email, is_active)
VALUES ('admin', '${md5("admin")}', 'admin@example.com', true)
ON CONFLICT (username) DO NOTHING;
          `,
        });
      }

      return NextResponse.json({
        success: true,
        message: "管理员账号创建成功",
        admin: newAdmin,
        credentials: {
          username: "admin",
          password: "admin",
        },
      });
    }
  } catch (error: unknown) {
    console.error("Init error:", error);
    let errorMessage = "初始化失败";
    let errorDetails = "";
    
    if (error instanceof Error) {
      errorMessage = error.message;
      errorDetails = error.stack || "";
    }
    
    // 返回SQL脚本以便手动执行
    return NextResponse.json({
      success: false,
      error: errorMessage,
      details: errorDetails,
      message: "初始化失败，请在Supabase SQL Editor中执行以下脚本",
      sql: `
-- 创建管理员表
CREATE TABLE IF NOT EXISTS public.admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  email TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login TIMESTAMP WITH TIME ZONE
);

-- 禁用RLS
ALTER TABLE public.admins DISABLE ROW LEVEL SECURITY;

-- 插入默认管理员
INSERT INTO public.admins (username, password_hash, email, is_active)
VALUES ('admin', '${md5("admin")}', 'admin@example.com', true)
ON CONFLICT (username) DO NOTHING;
      `,
    });
  }
}
