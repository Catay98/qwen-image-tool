import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY || '';
const stripe = new Stripe(stripeSecretKey, {
  apiVersion: '2024-12-18.acacia' as any,
});

export async function POST(request: NextRequest) {
  try {
    const { customerId } = await request.json();
    
    if (!customerId) {
      return NextResponse.json({ error: '请提供客户ID' }, { status: 400 });
    }

    console.log(`删除客户 ${customerId}...`);
    
    // 先获取并取消该客户的所有活跃订阅
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: 'active',
      limit: 100
    });
    
    let cancelledCount = 0;
    for (const sub of subscriptions.data) {
      try {
        await stripe.subscriptions.cancel(sub.id);
        cancelledCount++;
      } catch (error) {
        console.error(`取消订阅 ${sub.id} 失败:`, error);
      }
    }
    
    // 删除客户
    const deleted = await stripe.customers.del(customerId);
    
    return NextResponse.json({
      success: true,
      deleted: deleted.deleted,
      customer_id: deleted.id,
      subscriptions_cancelled: cancelledCount,
      message: `成功删除客户 ${customerId}，取消了 ${cancelledCount} 个订阅`
    });
    
  } catch (error: any) {
    console.error('删除客户失败:', error);
    return NextResponse.json({
      error: '删除失败',
      details: error.message
    }, { status: 500 });
  }
}