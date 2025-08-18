import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { cookies } from 'next/headers';

// GET - Fetch all subscriptions with user info
export async function GET(request: NextRequest) {
  try {
    // Verify admin authentication
    const cookieStore = await cookies();
    const adminToken = cookieStore.get('admin_token');
    
    if (!adminToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    const userId = searchParams.get('user_id');
    const planId = searchParams.get('plan_id');

    let query = supabase
      .from('subscriptions')
      .select(`
        *,
        users(email, name),
        subscription_plans(name, price, duration_type, duration_value)
      `)
      .order('created_at', { ascending: false });

    // Apply filters
    if (status) {
      query = query.eq('status', status);
    }
    if (userId) {
      query = query.eq('user_id', userId);
    }
    if (planId) {
      query = query.eq('plan_id', planId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching subscriptions:', error);
      return NextResponse.json({ error: 'Failed to fetch subscriptions' }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create new subscription for a user
export async function POST(request: NextRequest) {
  try {
    // Verify admin authentication
    const cookieStore = await cookies();
    const adminToken = cookieStore.get('admin_token');
    
    if (!adminToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { user_id, plan_id, start_date, end_date } = body;

    if (!user_id || !plan_id) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Check for existing active subscription
    const { data: existing } = await supabase
      .from('subscriptions')
      .select('id')
      .eq('user_id', user_id)
      .eq('status', 'active')
      .single();

    if (existing) {
      return NextResponse.json({ 
        error: 'User already has an active subscription' 
      }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('subscriptions')
      .insert({
        user_id,
        plan_id,
        status: 'active',
        start_date: start_date || new Date().toISOString(),
        end_date: end_date || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating subscription:', error);
      return NextResponse.json({ error: 'Failed to create subscription' }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT - Update subscription (extend, cancel, etc.)
export async function PUT(request: NextRequest) {
  try {
    // Verify admin authentication
    const cookieStore = await cookies();
    const adminToken = cookieStore.get('admin_token');
    
    if (!adminToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, action, ...updateData } = body;

    if (!id) {
      return NextResponse.json({ error: 'Missing subscription ID' }, { status: 400 });
    }

    let updates: any = {};

    switch (action) {
      case 'cancel':
        updates = { status: 'cancelled', cancelled_at: new Date().toISOString() };
        break;
      case 'extend':
        const { days } = updateData;
        if (!days) {
          return NextResponse.json({ error: 'Missing days to extend' }, { status: 400 });
        }
        // Get current subscription
        const { data: current } = await supabase
          .from('subscriptions')
          .select('end_date')
          .eq('id', id)
          .single();
        
        if (current) {
          const newEndDate = new Date(current.end_date);
          newEndDate.setDate(newEndDate.getDate() + days);
          updates = { end_date: newEndDate.toISOString() };
        }
        break;
      case 'activate':
        updates = { status: 'active' };
        break;
      case 'expire':
        updates = { status: 'expired' };
        break;
      default:
        updates = updateData;
    }

    const { data, error } = await supabase
      .from('subscriptions')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating subscription:', error);
      return NextResponse.json({ error: 'Failed to update subscription' }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Delete subscription (not recommended, prefer cancellation)
export async function DELETE(request: NextRequest) {
  try {
    // Verify admin authentication
    const cookieStore = await cookies();
    const adminToken = cookieStore.get('admin_token');
    
    if (!adminToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json({ error: 'Missing subscription ID' }, { status: 400 });
    }

    // Soft delete by cancelling
    const { data, error } = await supabase
      .from('subscriptions')
      .update({ 
        status: 'cancelled',
        cancelled_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error deleting subscription:', error);
      return NextResponse.json({ error: 'Failed to delete subscription' }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}