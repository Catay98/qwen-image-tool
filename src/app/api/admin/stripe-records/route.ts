import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY || '';
const stripe = new Stripe(stripeSecretKey, {
  apiVersion: '2024-12-18.acacia' as Stripe.LatestApiVersion,
});

interface CustomerRecord {
  id: string;
  email: string | null;
  name: string | null;
  created: string;
  metadata: Record<string, string>;
}

interface SubscriptionRecord {
  id: string;
  customer: string;
  status: string;
  cancel_at_period_end: boolean;
  current_period_start: string;
  current_period_end: string;
  created: string;
  canceled_at: string | null;
  amount: number;
  currency: string;
  interval: string;
  product_name: string;
  metadata: Record<string, string>;
  found_by?: string;
  items: Array<{
    id: string;
    price: string;
    quantity: number;
    amount: number;
  }>;
}

interface ChargeRecord {
  id: string;
  amount: number;
  currency: string;
  status: string;
  created: string;
  description: string | null;
  customer: string;
}

interface PaymentRecord {
  id: string;
  amount: number;
  currency: string | null;
  status: string;
  created: string;
  customer_email: string | null;
  metadata: Record<string, string> | null;
}

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();
    
    if (!email) {
      return NextResponse.json({ error: '请提供邮箱' }, { status: 400 });
    }

    console.log(`查询 ${email} 的Stripe记录...`);
    
    const results = {
      customers: [] as CustomerRecord[],
      subscriptions: [] as SubscriptionRecord[],
      payments: [] as PaymentRecord[],
      charges: [] as ChargeRecord[]
    };

    // 1. 搜索所有匹配邮箱的客户
    let hasMore = true;
    let startingAfter: string | undefined = undefined;
    
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
          name: customer.name,
          created: new Date(customer.created * 1000).toISOString(),
          metadata: customer.metadata
        });
        
        // 获取该客户的所有订阅
        const subscriptions = await stripe.subscriptions.list({
          customer: customer.id,
          status: 'all',
          limit: 100
        });
        
        for (const sub of subscriptions.data) {
          // 获取订阅的价格信息
          const priceInfo = sub.items.data[0]?.price;
          let amount = 0;
          let interval = '';
          let productName = '';
          
          if (priceInfo) {
            amount = priceInfo.unit_amount ? priceInfo.unit_amount / 100 : 0;
            interval = priceInfo.recurring?.interval || 'one_time';
            
            // 尝试获取产品名称
            try {
              if (typeof priceInfo.product === 'string') {
                const product = await stripe.products.retrieve(priceInfo.product);
                if ('name' in product) {
                  productName = product.name;
                }
              } else if (typeof priceInfo.product === 'object' && priceInfo.product && 'name' in priceInfo.product) {
                productName = priceInfo.product.name;
              }
            } catch (err) {
              console.log('获取产品名称失败:', err);
            }
          }
          
          const subWithPeriod = sub as Stripe.Subscription & { current_period_start?: number; current_period_end?: number };
          const currentPeriodStart = subWithPeriod.current_period_start || sub.created;
          const currentPeriodEnd = subWithPeriod.current_period_end || sub.created;
          
          results.subscriptions.push({
            id: sub.id,
            customer: customer.id,
            status: sub.status,
            cancel_at_period_end: sub.cancel_at_period_end,
            current_period_start: new Date(currentPeriodStart * 1000).toISOString(),
            current_period_end: new Date(currentPeriodEnd * 1000).toISOString(),
            created: new Date(sub.created * 1000).toISOString(),
            canceled_at: sub.canceled_at ? new Date(sub.canceled_at * 1000).toISOString() : null,
            amount: amount,
            currency: priceInfo?.currency || 'usd',
            interval: interval,
            product_name: productName || (sub.metadata as Record<string, string>)?.planName || '未知产品',
            metadata: sub.metadata,
            items: sub.items.data.map((item) => ({
              id: item.id,
              price: item.price.id,
              quantity: item.quantity,
              amount: item.price.unit_amount ? item.price.unit_amount / 100 : 0
            }))
          });
        }
        
        // 获取该客户的支付记录
        try {
          const charges = await stripe.charges.list({
            customer: customer.id,
            limit: 100
          });
          
          for (const charge of charges.data) {
            results.charges.push({
              id: charge.id,
              amount: charge.amount / 100,
              currency: charge.currency,
              status: charge.status,
              created: new Date(charge.created * 1000).toISOString(),
              description: charge.description,
              customer: customer.id
            });
          }
        } catch (error) {
          console.error('获取支付记录失败:', error);
        }
      }
      
      hasMore = customers.has_more;
      if (hasMore && customers.data.length > 0) {
        startingAfter = customers.data[customers.data.length - 1].id;
      }
    }
    
    // 2. 通过metadata搜索可能遗漏的订阅
    try {
      const metadataSearch = await stripe.subscriptions.search({
        query: `metadata['userEmail']:'${email}' OR metadata['email']:'${email}'`,
        limit: 100
      });
      
      for (const sub of metadataSearch.data) {
        if (!results.subscriptions.find(s => s.id === sub.id)) {
          const subWithPeriod = sub as Stripe.Subscription & { current_period_start?: number; current_period_end?: number };
          const currentPeriodStart = subWithPeriod.current_period_start || sub.created;
          const currentPeriodEnd = subWithPeriod.current_period_end || sub.created;
          
          results.subscriptions.push({
            id: sub.id,
            customer: sub.customer as string,
            status: sub.status,
            cancel_at_period_end: sub.cancel_at_period_end,
            current_period_start: new Date(currentPeriodStart * 1000).toISOString(),
            current_period_end: new Date(currentPeriodEnd * 1000).toISOString(),
            created: new Date(sub.created * 1000).toISOString(),
            canceled_at: sub.canceled_at ? new Date(sub.canceled_at * 1000).toISOString() : null,
            amount: 0,
            currency: 'usd',
            interval: 'unknown',
            product_name: (sub.metadata as Record<string, string>)?.planName || '未知产品',
            metadata: sub.metadata,
            found_by: 'metadata_search',
            items: []
          });
        }
      }
    } catch (error) {
      console.error('Metadata搜索失败:', error);
    }
    
    // 3. 获取最近的支付会话
    try {
      const sessions = await stripe.checkout.sessions.list({
        limit: 100
      });
      
      for (const session of sessions.data) {
        if (session.customer_email === email || 
            session.metadata?.userEmail === email ||
            session.metadata?.email === email) {
          results.payments.push({
            id: session.id,
            amount: session.amount_total ? session.amount_total / 100 : 0,
            currency: session.currency,
            status: session.payment_status,
            created: new Date(session.created * 1000).toISOString(),
            customer_email: session.customer_email,
            metadata: session.metadata
          });
        }
      }
    } catch (error) {
      console.error('获取支付会话失败:', error);
    }
    
    return NextResponse.json({
      success: true,
      email: email,
      customers: results.customers,
      subscriptions: results.subscriptions,
      charges: results.charges,
      payments: results.payments,
      summary: {
        customers_count: results.customers.length,
        subscriptions_count: results.subscriptions.length,
        active_subscriptions: results.subscriptions.filter(s => s.status === 'active' || s.status === 'trialing').length,
        charges_count: results.charges.length,
        payments_count: results.payments.length
      }
    });
    
  } catch (error) {
    console.error('Stripe查询失败:', error);
    return NextResponse.json({
      error: '查询失败',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}