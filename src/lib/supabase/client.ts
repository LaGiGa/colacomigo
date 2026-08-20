import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/database.types'

const DEFAULT_SUPABASE_URL = 'https://ygdlmathcksuhnybkcpy.supabase.co'
const DEFAULT_SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlnZGxtYXRoY2tzdWhueWJrY3B5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI2NzUyNzYsImV4cCI6MjA4ODI1MTI3Nn0.-W97wm88UqWT4sLs_Fgfah6NimmcW_lGzkx2OhvsSoc'

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || DEFAULT_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY

  return createBrowserClient<Database>(url, anonKey)
}
