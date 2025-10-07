# ExportReq — Vercel-ready static site (Arabic, RTL, Dark theme)

This project is a static frontend (HTML/CSS/JS) integrated with Supabase Auth and Database.
Designed for deployment on **Vercel**. Set environment variables in Vercel Project Settings:
- SUPABASE_URL
- SUPABASE_ANON_KEY

Domain used: https://export-req.vercel.app

Pages:
- index.html
- login.html
- signup.html
- complete-profile.html
- dashboard.html
- new-record.html

Deployment:
1. Push this repository to GitHub.
2. Import the repo into Vercel (New Project → Import from Git).
3. In Vercel Dashboard → Project Settings → Environment Variables, add:
   - SUPABASE_URL = https://uulzslgyqygvtpfgeecr.supabase.co
   - SUPABASE_ANON_KEY = <your anon key>
4. Deploy. Vercel will inject env vars at build time.

Notes:
- Ensure Supabase Authentication → URL Configuration → Site URL is set to:
  https://export-req.vercel.app
- Redirect URL: https://export-req.vercel.app/complete-profile.html
- Make sure RLS policies on `profiles` table allow authenticated users to INSERT/UPDATE their own profile.
