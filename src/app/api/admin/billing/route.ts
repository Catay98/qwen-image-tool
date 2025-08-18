import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { cookies } from 'next/headers';

// GET - Fetch billing data with filters
export async function GET(request: NextRequest) {
  try {
    // Verify admin authentication
    const cookieStore = await cookies();
    const adminToken = cookieStore.get('admin_token');
    
    if (!adminToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');
    const userId = searchParams.get('user_id');
    const type = searchParams.get('type'); // 'payments' or 'points'

    let query;

    if (type === 'points') {
      query = supabase
        .from('points_purchase_records')
        .select('*, users(email)')
        .order('created_at', { ascending: false });
    } else {
      query = supabase
        .from('payment_records')
        .select('*, users(email)')
        .order('created_at', { ascending: false });
    }

    // Apply filters
    if (startDate) {
      query = query.gte('created_at', startDate);
    }
    if (endDate) {
      query = query.lte('created_at', endDate + 'T23:59:59');
    }
    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching billing data:', error);
      return NextResponse.json({ error: 'Failed to fetch billing data' }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create manual billing record (for adjustments)
export async function POST(request: NextRequest) {
  try {
    // Verify admin authentication
    const cookieStore = await cookies();
    const adminToken = cookieStore.get('admin_token');
    
    if (!adminToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { user_id, amount, type, description } = body;

    if (!user_id || !amount || !type) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Create manual adjustment record
    const { data, error } = await supabase
      .from('payment_records')
      .insert({
        user_id,
        amount,
        currency: 'USD',
        payment_type: type,
        payment_method: 'manual_adjustment',
        payment_status: 'completed',
        transaction_id: `MANUAL-${Date.now()}`,
        description
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating billing record:', error);
      return NextResponse.json({ error: 'Failed to create billing record' }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT - Update billing record status
export async function PUT(request: NextRequest) {
  try {
    // Verify admin authentication
    const cookieStore = await cookies();
    const adminToken = cookieStore.get('admin_token');
    
    if (!adminToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, status, type } = body;

    if (!id || !status) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const table = type === 'points' ? 'points_purchase_records' : 'payment_records';

    const { data, error } = await supabase
      .from(table)
      .update({ payment_status: status })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating billing record:', error);
      return NextResponse.json({ error: 'Failed to update billing record' }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Delete billing record (soft delete recommended)
export async function DELETE(request: NextRequest) {
  try {
    // Verify admin authentication
    const cookieStore = await cookies();
    const adminToken = cookieStore.get('admin_token');
    
    if (!adminToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, type } = body;

    if (!id) {
      return NextResponse.json({ error: 'Missing record ID' }, { status: 400 });
    }

    const table = type === 'points' ? 'points_purchase_records' : 'payment_records';

    // Soft delete by updating status
    const { data, error } = await supabase
      .from(table)
      .update({ payment_status: 'cancelled' })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error deleting billing record:', error);
      return NextResponse.json({ error: 'Failed to delete billing record' }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}