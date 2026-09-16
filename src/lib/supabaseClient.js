import { createClient } from '@supabase/supabase-js'

// Thay thế bằng URL và Anon Key lấy từ Supabase Dashboard của bạn
const supabaseUrl = 'https://kfpjjerxujoltsxujfbh.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtmcGpqZXJ4dWpvbHRzeHVqZmJoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk1MzkxNTksImV4cCI6MjEwNTExNTE1OX0.J5c79kp7Ud46XbtHa-b-jBDlFPMqL2TWwIlZ3v03RyA'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)