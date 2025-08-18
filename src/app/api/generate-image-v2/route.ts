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

export async function POST(request: Request) {
  try {
    const { prompt, userId, aspectRatio = "1:1" } = await request.json();

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

    // 调用统一的积分/免费次数消耗函数
    const { data: consumeResult, error: consumeError } = await supabase
      .rpc('consume_points_for_generation', {
        p_user_id: userId,
        p_api_endpoint: '/api/generate-image-v2',
        p_details: { prompt, aspectRatio }
      });

    if (consumeError) {
      console.error('Error consuming points:', consumeError);
      return NextResponse.json(
        { error: "系统错误，请稍后再试" },
        { status: 500 }
      );
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

    // 记录是否使用了积分（用于后续判断是否需要水印）
    const usedPoints = consumeResult.used_points || false;
    const freeUsesRemaining = consumeResult.free_uses_remaining || 0;

    // 使用302.ai的Aliyun文生图API
    const apiKey = process.env.API_302_KEY || "sk-lDX0Kbb9Wdz5BFLQPPE9Sa8QOGw5bVgDTpvZ9hOWpRBsFFI6";
    const apiUrl = "https://api.302.ai/aliyun/api/v1/services/aigc/text2image/image-synthesis";
    
    console.log("Generating image with prompt:", prompt);
    
    // 根据aspectRatio确定图片尺寸
    let size = "1024*1024";
    if (aspectRatio === "16:9") {
      size = "1280*720";
    } else if (aspectRatio === "9:16") {
      size = "720*1280";
    }
    
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: "wanx2.1-t2i-turbo",  // 使用turbo版本，更快
        input: {
          prompt: prompt,
        },
        parameters: {
          size: size,
          n: 1,
        },
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("API Error Response:", errorText);
      throw new Error(`Image generation failed: ${response.status}`);
    }

    const data = await response.json();
    console.log("Task created:", data);
    
    // 获取任务ID
    const taskId = data.output?.task_id;
    if (!taskId) {
      console.error("No task_id in response:", data);
      throw new Error("Failed to create image generation task");
    }
    
    // 等待任务完成并获取图片URL
    console.log(`Waiting for task ${taskId} to complete...`);
    const imageUrl = await waitForTaskCompletion(taskId, apiKey);
    
    if (!imageUrl) {
      throw new Error("Failed to generate image");
    }

    console.log("Image generated successfully:", imageUrl);
    
    // 返回结果，根据是否使用积分决定是否需要水印
    return NextResponse.json({ 
      imageUrl,
      isFreeTier: !usedPoints,
      freeUsesRemaining: freeUsesRemaining,
      watermark: !usedPoints ? 'aiqwen.cc' : null,
      pointsRemaining: consumeResult.remaining_points || 0
    });
  } catch (error) {
    console.error("Image generation error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "生成失败，请稍后再试" },
      { status: 500 }
    );
  }
}