import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://edcsfjswoplnrqrirrwm.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVkY3NmanN3b3BsbnJxcmlycndtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5MDMxNTgsImV4cCI6MjA3MDQ3OTE1OH0.g_8Hbu0KCXV_BYMHS4q3XH53ZX90JodDKvNcto0_GEQ'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string | null
          name: string | null
          avatar_url: string | null
          provider: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email?: string | null
          name?: string | null
          avatar_url?: string | null
          provider?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string | null
          name?: string | null
          avatar_url?: string | null
          provider?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      image_history: {
        Row: {
          id: string
          user_id: string
          prompt: string
          image_url: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          prompt: string
          image_url: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          prompt?: string
          image_url?: string
          created_at?: string
        }
      }
    }
  }
}