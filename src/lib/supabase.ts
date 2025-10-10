import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://uulzslgyqygvtpfgeecr.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV1bHpzbGd5cXlndnRwZmdlZWNyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk3NzM4ODEsImV4cCI6MjA3NTM0OTg4MX0.VLJ_R6aKKz39AvZphb0JGVspUpw--l2JNzrk5yuNwkQ';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);