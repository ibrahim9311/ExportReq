// js/supabase.js
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// إعداد Supabase
const SUPABASE_URL = 'https://uulzslgyqygvtpfgeecr.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV1bHpzbGd5cXlndnRwZmdlZWNyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk3NzM4ODEsImV4cCI6MjA3NTM0OTg4MX0.VLJ_R6aKKz39AvZphb0JGVspUpw--l2JNzrk5yuNwkQ';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const formData = {
  id: user.id,
  username_en: document.getElementById("username_en").value,
  full_name_ar: document.getElementById("full_name_ar").value,
  birth_date: document.getElementById("birth_date").value,
  region_id: document.getElementById("region_id").value,
  // باقي الحقول...
};

