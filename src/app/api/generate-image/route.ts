import { NextResponse } from "next/server";
import { supabase } from '@/lib/supabase';

async function waitForTaskCompletion(taskId: string, apiKey: string, maxAttempts = 30): Promise<string | null> {
  const taskUrl = `https://api.302.ai/aliyun/api/v1/tasks/${taskId}`;
  
  const headers = new Headers();
  headers.append("Authorization", `Bearer ${apiKey}`);
  
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const response = await fetch(taskUrl, {
        method: "GET",
        headers: headers,
      });
      
      if (!response.ok) {
        console.error(`Task status check failed: ${response.status}`);
        continue;
      }
      
      const result = await response.text();
      const data = JSON.parse(result);
      
      console.log(`Task status (attempt ${i + 1}):`, data.output?.task_status);
      
      // 检查任务状态
      if (data.output?.task_status === "SUCCEEDED") {
        // 任务成功，提取图片URL
        if (data.output?.results && Array.isArray(data.output.results) && data.output.results.length > 0) {
          // results[0] 是一个包含 url 字段的对象
          const result = data.output.results[0];
          if (result.url) {
            return result.url;
          }
          return result;
        } else if (data.output?.url) {
          return data.output.url;
        } else if (data.output?.image_url) {
          return data.output.image_url;
        }
        console.error("Task succeeded but no image URL found:", data);
        return null;
      } else if (data.output?.task_status === "FAILED") {
        console.error("Task failed:", data);
        return null;
      }
      
      // 任务仍在进行中，等待2秒后重试
      await new Promise(resolve => setTimeout(resolve, 2000));
    } catch (error) {
      console.error(`Error checking task status:`, error);
    }
  }
  
  console.error("Timeout waiting for task completion");
  return null;
}

// 记录用户使用情况
async function recordUsage(userId: string, prompt: string, imageUrl?: string) {
  try {
    // 使用数据库函数记录使用
    const { data, error } = await supabase.rpc('record_api_usage', {
      p_user_id: userId,
      p_api_endpoint: '/api/generate-image',
      p_details: {
        prompt: prompt,
        imageUrl: imageUrl,
        status: imageUrl ? 'success' : 'failed',
        timestamp: new Date().toISOString()
      }
    });

    if (error) {
      console.error('Error recording usage via RPC:', error);
      // 如果RPC失败，尝试直接记录
      const today = new Date().toISOString().split('T')[0];
      const apiCall = {
        timestamp: new Date().toISOString(),
        prompt: prompt,
        imageUrl: imageUrl,
        status: imageUrl ? 'success' : 'failed'
      };

      const { data: existingUsage } = await supabase
        .from('user_usage')
        .select('*')
        .eq('user_id', userId)
        .eq('date', today)
        .single();

      if (existingUsage) {
        const currentCalls = existingUsage.api_calls || [];
        await supabase
          .from('user_usage')
          .update({
            total_uses: existingUsage.total_uses + 1,
            free_uses_remaining: Math.max(0, existingUsage.free_uses_remaining - 1),
            api_calls: [...currentCalls, apiCall]
          })
          .eq('id', existingUsage.id);
      } else {
        await supabase
          .from('user_usage')
          .insert({
            user_id: userId,
            date: today,
            total_uses: 1,
            free_uses_remaining: 9, // 默认10次免费使用，已用1次
            api_calls: [apiCall]
          });
      }
    } else {
      console.log('Usage recorded:', data);
    }
  } catch (error) {
    console.error('Error recording usage:', error);
  }
}

export async function POST(request: Request) {
  let consumeResult: any = null; // 在顶层定义consumeResult
  
  try {
    const { prompt, userId } = await request.json();

    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json({ error: "Invalid prompt" }, { status: 400 });
    }

    // 必须登录才能生成图片
    if (!userId) {
      return NextResponse.json(
        { error: "请先登录后再生成图片", needLogin: true },
        { status: 401 }
      );
    }

    // 检查订阅状态并清理过期积分
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .single();
    
    if (subscription) {
      const now = new Date();
      const endDate = new Date(subscription.end_date);
      
      if (endDate < now) {
        // 订阅已过期，清零积分
        await supabase
          .from('subscriptions')
          .update({ status: 'expired' })
          .eq('id', subscription.id);
        
        // 清零用户积分
        const { data: userPoints } = await supabase
          .from('user_points')
          .select('available_points')
          .eq('user_id', userId)
          .single();
        
        if (userPoints && userPoints.available_points > 0) {
          await supabase
            .from('user_points')
            .update({
              available_points: 0,
              expired_points: (userPoints.expired_points || 0) + userPoints.available_points,
              updated_at: new Date().toISOString()
            })
            .eq('user_id', userId);
        }
        
        return NextResponse.json(
          { 
            error: "订阅已过期，请续费后继续使用",
            needSubscription: true,
            subscriptionExpired: true
          },
          { status: 403 }
        );
      }
    }

    // 调用积分消耗函数（每次生成消耗10积分）
    const { data, error: consumeError } = await supabase
      .rpc('consume_user_points', {
        p_user_id: userId,
        p_points: 10,
        p_reason: `生成图片: ${prompt.substring(0, 50)}...`
      });
    
    consumeResult = data; // 赋值给顶层变量

    if (consumeError) {
      console.error('Error consuming points:', consumeError);
      
      // 检查是否是积分不足
      if (consumeError.message?.includes('Insufficient') || consumeError.code === 'P0001') {
        // 尝试使用免费次数
        const { data: freeUsage, error: freeError } = await supabase
          .rpc('record_api_usage', {
            p_user_id: userId,
            p_api_endpoint: '/api/generate-image',
            p_details: { prompt }
          });
        
        if (freeError || !freeUsage?.free_uses_remaining || freeUsage.free_uses_remaining <= 0) {
          return NextResponse.json(
            { 
              error: "积分不足且免费次数已用完，请充值继续使用",
              needSubscription: true,
              freeUsesRemaining: 0,
              availablePoints: 0
            },
            { status: 403 }
          );
        }
        
        // 使用免费次数
        consumeResult = {
          success: true,
          used_points: false,
          free_uses_remaining: freeUsage.free_uses_remaining,
          remaining_points: 0
        };
      } else {
        return NextResponse.json(
          { error: "系统错误，请稍后再试" },
          { status: 500 }
        );
      }
    }

    if (!consumeResult?.success) {
      // 既没有积分也没有免费次数
      return NextResponse.json(
        { 
          error: consumeResult?.message || "免费次数已用完，请充值积分继续使用",
          needSubscription: true,
          freeUsesRemaining: 0,
          availablePoints: consumeResult?.available_points || 0
        },
        { status: 403 }
      );
    }

    console.log(`用户 ${userId} 生成图片，剩余积分: ${consumeResult.remaining_points}，剩余免费次数: ${consumeResult.free_uses_remaining}`);

    // 使用302.ai的Aliyun文生图API
    const apiUrl = "https://api.302.ai/aliyun/api/v1/services/aigc/text2image/image-synthesis";
    const apiKey = process.env.API_302_KEY || "sk-lDX0Kbb9Wdz5BFLQPPE9Sa8QOGw5bVgDTpvZ9hOWpRBsFFI6";

    const myHeaders = new Headers();
    myHeaders.append("Authorization", `Bearer ${apiKey}`);
    myHeaders.append("Content-Type", "application/json");

    const raw = JSON.stringify({
      model: "wan2.2-t2i-flash",
      input: {
        prompt: prompt,
      },
      parameters: {
        size: "1024*1024",
        n: 1,
      },
    });

    // 步骤1：创建图像生成任务
    console.log("Creating image generation task...");
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: myHeaders,
      body: raw,
      redirect: "follow" as RequestRedirect,
    });

    const result = await response.text();
    
    if (!response.ok) {
      console.error("API Error Response:", result);
      // 记录失败的使用
      if (userId) {
        await recordUsage(userId, prompt);
      }
      throw new Error(`Image generation failed: ${response.status}`);
    }

    let responseData;
    try {
      responseData = JSON.parse(result);
    } catch (e) {
      console.error("Failed to parse response as JSON:", result);
      if (userId) {
        await recordUsage(userId, prompt);
      }
      throw new Error("Invalid response format");
    }

    console.log("Task created:", responseData);
    
    // 步骤2：获取任务ID
    const taskId = responseData.output?.task_id;
    if (!taskId) {
      console.error("No task_id in response:", responseData);
      if (userId) {
        await recordUsage(userId, prompt);
      }
      throw new Error("Failed to create image generation task");
    }
    
    // 步骤3：等待任务完成并获取图片URL
    console.log(`Waiting for task ${taskId} to complete...`);
    const imageUrl = await waitForTaskCompletion(taskId, apiKey);
    
    if (!imageUrl) {
      if (userId) {
        await recordUsage(userId, prompt);
      }
      throw new Error("Failed to generate image");
    }

    // 记录成功的使用
    if (userId) {
      await recordUsage(userId, prompt, imageUrl);
    }

    console.log("Image generated successfully:", imageUrl);
    
    // 返回结果，包含免费次数和积分信息
    return NextResponse.json({ 
      imageUrl,
      isFreeTier: !consumeResult.used_points,
      freeUsesRemaining: consumeResult.free_uses_remaining || 0,
      watermark: !consumeResult.used_points ? 'aiqwen.cc' : null,
      pointsRemaining: consumeResult.remaining_points || 0
    });
  } catch (error) {
    console.error("Image generation error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "生成失败，请稍后再试" },
      { status: error instanceof Error && error.message.includes("免费使用次数") ? 403 : 500 }
    );
  }
}