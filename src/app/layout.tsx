import type { Metadata } from "next";
import { Inter, Noto_Sans_Thai } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { Toaster } from "react-hot-toast";
import InstallPrompt from "@/components/InstallPrompt";

const inter = Inter({ subsets: ["latin"], variable: "--font-body" });
const notoSansThai = Noto_Sans_Thai({ subsets: ["thai"], variable: "--font-thai" });

export const metadata: Metadata = {
  title: "PPK CHOIR | ชุมนุมสานฝันด้วยเส้นเสียง",
  description: "นวัตกรรมการจัดการเรียนรู้และประเมินผลสำหรับชุมนุมขับร้องประสานเสียง PPK CHOIR",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "PPK CHOIR",
  },
  other: {
    "mobile-web-app-capable": "yes",
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "black-translucent",
  },
};

import Sidebar from '@/components/Sidebar';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icon-512.jpg" />
        <meta name="theme-color" content="#1a1a3e" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="PPK CHOIR" />
      </head>
      <body className={`${inter.variable} ${notoSansThai.variable}`}>
        <AuthProvider>
          <Sidebar />
          <main className="app-container">
            {children}
          </main>
          <Toaster 
            position="top-center"
            toastOptions={{
              style: {
                background: 'rgba(0,0,0,0.8)',
                color: '#fff',
                border: '1px solid rgba(255,255,255,0.1)',
                backdropFilter: 'blur(10px)',
              }
            }}
          />
          <InstallPrompt />
        </AuthProvider>
      </body>
    </html>
  );
}

