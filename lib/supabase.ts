import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://nmvxkuynxbluxeudognv.supabase.co"
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5tdnhrdXlueGJsdXhldWRvZ252Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYzNTExMTgsImV4cCI6MjA3MTkyNzExOH0.O-w6VizuW17AE08eaX1vHFtMD1k8JPHSh3n4sIVpwmk"

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types
export interface Transaction {
  id?: number
  date: string
  category: string
  "sub-category": string
  description: string
  nominal: number
  account: string
  destination_account?: string
  receipt_url?: string
  created_at?: string
}

export interface Platform {
  id?: number
  account: string
  type_account: string
  saldo: number
  color: string
  saving: boolean
  created_at?: string
}

export interface Debt {
  id?: number
  name: string
  total: number
  remaining: number
  interest: number
  minimum: number
  "due-date": string
  description: string
  created_at?: string
}

export interface Goal {
  id?: number
  goal: string
  target: number
  deadline: string
  description: string
  created_at?: string
}
