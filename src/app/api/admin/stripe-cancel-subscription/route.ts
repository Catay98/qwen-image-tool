import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY || '';
const stripe = new Stripe(stripeSecretKey, {
  apiVersion: '2024-12-18.acacia' as any,
});

export async function POST(request: NextRequest) {
  try {
    const { subscriptionId } = await request.json();
    
    if (!subscriptionId) {
      return NextResponse.json({ error: '请提供订阅ID' }, { status: 400 });
    }

    console.log(`取消订阅 ${subscriptionId}...`);
    
    // 立即取消订阅
    const cancelled = await stripe.subscriptions.cancel(subscriptionId, {
      prorate: false,
      invoice_now: false
    });
    
    return NextResponse.json({
      success: true,
      subscription: {
        id: cancelled.id,
        status: cancelled.status,
        canceled_at: new Date(cancelled.canceled_at * 1000).toISOString(),
        customer: cancelled.customer
      }
    });
    
  } catch (error: any) {
    console.error('取消订阅失败:', error);
    return NextResponse.json({
      error: '取消失败',
      details: error.message
    }, { status: 500 });
  }
}