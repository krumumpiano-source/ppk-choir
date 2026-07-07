import type { Metadata } from "next";
import { Inter, Noto_Sans_Thai } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { Toaster } from "react-hot-toast";

const inter = Inter({ subsets: ["latin"], variable: "--font-body" });
const notoSansThai = Noto_Sans_Thai({ subsets: ["thai"], variable: "--font-thai" });

export const metadata: Metadata = {
  title: "PPK CHOIR | ชุมนุมสานฝันด้วยเส้นเสียง",
  description: "นวัตกรรมการจัดการเรียนรู้และประเมินผลสำหรับชุมนุมขับร้องประสานเสียง PPK CHOIR",
};

import Sidebar from '@/components/Sidebar';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th">
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
        </AuthProvider>
      </body>
    </html>
  );
}
