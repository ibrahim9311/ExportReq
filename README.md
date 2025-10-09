<<<<<<< HEAD
This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
=======
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
>>>>>>> 777c320a781a049030ff0f9371451b44ae2540e2
