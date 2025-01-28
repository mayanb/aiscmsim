import { createClient } from '@supabase/supabase-js'

// Define types
export type Session = {
  id: number
  name: string
  is_active: boolean
}

export type Player = {
  id: number
  name: string
  session_id: number
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)