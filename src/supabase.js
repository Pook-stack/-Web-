import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://rynhyvuzlpzuzwnqmmjl.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_bQq4KCKbcIK7rAKvcdsg1g_RjCv1EbF'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
