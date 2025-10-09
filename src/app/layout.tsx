import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner"

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "My App",
  description: "My App description",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ar" dir="rtl">
      {/* Next.js expects <head> to be a child of <html>, but it must not be self-closing */}
      <head></head>
      <body className={inter.className} suppressHydrationWarning>
        {children}
        <Toaster richColors />
      </body>
    </html>
  );
}

