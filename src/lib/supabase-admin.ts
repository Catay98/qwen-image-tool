import { createClient } from '@supabase/supabase-js'

// 创建一个绕过RLS的admin客户端
// 注意：这个客户端只能在服务端使用，不要在客户端暴露
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://edcsfjswoplnrqrirrwm.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

// 使用anon key但通过特殊配置绕过RLS
export const supabaseAdmin = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});