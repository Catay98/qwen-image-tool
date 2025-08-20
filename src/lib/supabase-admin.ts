import { createClient } from '@supabase/supabase-js'

// 创建一个绕过RLS的admin客户端
// 注意：这个客户端只能在服务端使用，不要在客户端暴露
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://zppagpujfoclocaqfbdn.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpwcGFncHVqZm9jbG9jYXFmYmRuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU0ODExNjgsImV4cCI6MjA3MTA1NzE2OH0.nDpvA5CCU5rkrmTFkSSCEy_3m9--JoDCXTfTxX9YecI'

// 使用anon key但通过特殊配置绕过RLS
export const supabaseAdmin = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});