import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY || '';
const stripe = new Stripe(stripeSecretKey, {
  apiVersion: '2024-12-18.acacia',
});

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();
    
    if (!email) {
      return NextResponse.json({ error: '请提供邮箱' }, { status: 400 });
    }

    console.log(`开始处理 ${email} 的Stripe订阅...`);
    
    const results = {
      customers: [],
      subscriptions: [],
      cancelled: [],
      errors: []
    };

    // 1. 搜索所有匹配邮箱的客户
    let hasMore = true;
    let startingAfter = undefined;
    
    while (hasMore) {
      const customers = await stripe.customers.list({
        email: email,
        limit: 100,
        starting_after: startingAfter
      });
      
      for (const customer of customers.data) {
        results.customers.push({
          id: customer.id,
          email: customer.email,
          created: new Date(customer.created * 1000).toISOString()
        });
        
        // 获取该客户的所有订阅
        const subscriptions = await stripe.subscriptions.list({
          customer: customer.id,
          status: 'all',
          limit: 100
        });
        
        for (const sub of subscriptions.data) {
          results.subscriptions.push({
            id: sub.id,
            customer: customer.id,
            status: sub.status,
            cancel_at_period_end: sub.cancel_at_period_end
          });
          
          // 如果订阅是活跃的，取消它
          if (sub.status === 'active' || sub.status === 'trialing' || sub.status === 'past_due') {
            try {
              const cancelled = await stripe.subscriptions.cancel(sub.id, {
                prorate: false,
                invoice_now: false
              });
              
              results.cancelled.push({
                id: cancelled.id,
                status: 'cancelled',
                cancelled_at: new Date().toISOString()
              });
            } catch (error: any) {
              results.errors.push({
                subscription_id: sub.id,
                error: error.message
              });
            }
          }
        }
        
        // 可选：删除客户（这会删除所有相关数据）
        // 注意：这是不可逆的操作！
        // try {
        //   await stripe.customers.del(customer.id);
        //   console.log(`已删除客户 ${customer.id}`);
        // } catch (error) {
        //   console.error(`无法删除客户 ${customer.id}:`, error);
        // }
      }
      
      hasMore = customers.has_more;
      if (hasMore && customers.data.length > 0) {
        startingAfter = customers.data[customers.data.length - 1].id;
      }
    }
    
    // 2. 通过搜索所有订阅来查找可能遗漏的
    const allSubscriptions = await stripe.subscriptions.search({
      query: `metadata['userEmail']:'${email}' OR metadata['email']:'${email}'`,
      limit: 100
    });
    
    for (const sub of allSubscriptions.data) {
      if (!results.subscriptions.find(s => s.id === sub.id)) {
        results.subscriptions.push({
          id: sub.id,
          customer: sub.customer as string,
          status: sub.status,
          found_by: 'metadata_search'
        });
        
        if (sub.status === 'active' || sub.status === 'trialing') {
          try {
            await stripe.subscriptions.cancel(sub.id);
            results.cancelled.push({
              id: sub.id,
              status: 'cancelled_via_metadata',
              cancelled_at: new Date().toISOString()
            });
          } catch (error: any) {
            results.errors.push({
              subscription_id: sub.id,
              error: error.message
            });
          }
        }
      }
    }
    
    return NextResponse.json({
      success: true,
      email: email,
      summary: {
        customers_found: results.customers.length,
        subscriptions_found: results.subscriptions.length,
        subscriptions_cancelled: results.cancelled.length,
        errors: results.errors.length
      },
      details: results
    });
    
  } catch (error: any) {
    console.error('Stripe操作失败:', error);
    return NextResponse.json({
      error: '操作失败',
      details: error.message
    }, { status: 500 });
  }
}