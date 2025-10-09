import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner"

const inter = Inter({ subsets: ["latin"] });

    <html lang="ar" dir="rtl">
      <body className={inter.className}>
        {children}
        <Toaster richColors />
      </body>
    </html>
  );

