import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { supabase } from '@/lib/supabase';
import { sanitizeMultiLang } from '@/utils/sanitizeData';

export async function GET(request: Request) {
  // 验证管理员权限
  const cookieStore = await cookies();
  const token = cookieStore.get('admin-token');
  
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // 从请求头获取语言偏好
    const lang = request.headers.get('accept-language')?.includes('zh') ? 'zh' : 'en';
    
    // 获取订阅计划
    const { data: subscriptionPlans, error: plansError } = await supabase
      .from('subscription_plans')
      .select('*')
      .order('sort_order', { ascending: true });

    // 获取积分包
    const { data: pointsPackages, error: packagesError } = await supabase
      .from('points_packages')
      .select('*')
      .order('sort_order', { ascending: true });

    // 使用 sanitizeMultiLang 处理所有多语言字段
    const formattedPlans = subscriptionPlans?.map(plan => sanitizeMultiLang(plan, lang)) || [];
    const formattedPackages = pointsPackages?.map(pkg => sanitizeMultiLang(pkg, lang)) || [];

    return NextResponse.json({
      subscriptionPlans: formattedPlans,
      pointsPackages: formattedPackages
    });
  } catch (error) {
    console.error("Error fetching plans:", error);
    return NextResponse.json({
      subscriptionPlans: [],
      pointsPackages: []
    });
  }
}

export async function POST(request: Request) {
  // 验证管理员权限
  const cookieStore = await cookies();
  const token = cookieStore.get('admin-token');
  
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { type, plan, package: pkg } = body;

    if (type === 'subscription' && plan) {
      // 插入或更新订阅计划
      const planData = {
        name: plan.name,
        display_name: plan.display_name || plan.name,
        duration_type: plan.duration_type || 'month',
        duration_value: plan.duration_value || 1,
        price: plan.price,
        points: plan.points,
        description: plan.description || '',
        features: plan.features || [],
        is_active: plan.is_active !== undefined ? plan.is_active : true,
        sort_order: plan.sort_order || 100
      };
      
      // 如果有ID则更新，否则插入
      const { data, error } = plan.id 
        ? await supabase
            .from('subscription_plans')
            .update(planData)
            .eq('id', plan.id)
            .select()
            .single()
        : await supabase
            .from('subscription_plans')
            .insert(planData)
            .select()
            .single();

      if (error) {
        console.error("Error saving subscription plan:", error);
        return NextResponse.json({ error: "Failed to save plan" }, { status: 500 });
      }

      return NextResponse.json({ success: true, data });
    } else if (type === 'points') {
      // 处理积分包 - 注意前端发送的是 plan 而不是 package
      const pkgData = pkg || plan;
      if (!pkgData) {
        return NextResponse.json({ error: "Missing package data" }, { status: 400 });
      }
      
      const packageData = {
        name: pkgData.name,
        display_name: pkgData.display_name || pkgData.name,
        description: pkgData.description || '',
        price: pkgData.price,
        points: pkgData.points,
        validity_days: pkgData.validity_days || 60,
        features: pkgData.features || [],
        is_active: pkgData.is_active !== undefined ? pkgData.is_active : true,
        sort_order: pkgData.sort_order || 100
      };
      
      // 如果有ID则更新，否则插入
      const { data, error } = pkgData.id
        ? await supabase
            .from('points_packages')
            .update(packageData)
            .eq('id', pkgData.id)
            .select()
            .single()
        : await supabase
            .from('points_packages')
            .insert(packageData)
            .select()
            .single();

      if (error) {
        console.error("Error saving points package:", error);
        return NextResponse.json({ error: "Failed to save package" }, { status: 500 });
      }

      return NextResponse.json({ success: true, data });
    }

    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  } catch (error) {
    console.error("Error saving plan:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}