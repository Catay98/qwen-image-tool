import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const error = requestUrl.searchParams.get('error');
  const error_description = requestUrl.searchParams.get('error_description');

  // 如果有错误，记录并重定向
  if (error) {
    console.error('OAuth callback error:', error, error_description);
    return NextResponse.redirect(`${requestUrl.origin}/?auth_error=${encodeURIComponent(error_description || error)}`);
  }

  // 如果有code，交换token
  if (code) {
    try {
      const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
      
      if (exchangeError) {
        console.error('Error exchanging code for session:', exchangeError);
        return NextResponse.redirect(`${requestUrl.origin}/?auth_error=session_exchange_failed`);
      }

      console.log('Successfully authenticated user');
    } catch (err) {
      console.error('Unexpected error during auth callback:', err);
      return NextResponse.redirect(`${requestUrl.origin}/?auth_error=unexpected_error`);
    }
  }

  // 成功后重定向到首页
  return NextResponse.redirect(requestUrl.origin);
}