import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Aistrology | AI 占星 - 探索您的靈魂藍圖",
    template: "%s | Aistrology"
  },
  description: "Aistrology 結合精準星曆計算與先進 AI 技術，為您提供深度星盤解析、年度運勢報告與靈魂諮商。即刻開啟您的占星之旅，探索潛意識深處的真實自我。",
  keywords: ["占星", "星盤", "AI占星", "十二星座", "運勢", "占星報告", "心理占星", "靈魂藍圖"],
  authors: [{ name: "Aistrology Team" }],
  creator: "Aistrology",
  openGraph: {
    type: "website",
    locale: "zh_TW",
    url: "https://aistrology.com",
    title: "Aistrology | AI 占星 - 探索您的靈魂藍圖",
    description: "結合 AI 深度解析的現代占星平台。輸入生日，即刻獲取萬字靈魂指南。",
    siteName: "Aistrology",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Aistrology AI 占星"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "Aistrology | AI 占星 - 探索您的靈魂藍圖",
    description: "結合 AI 深度解析的現代占星平台。輸入生日，即刻獲取萬字靈魂指南。",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="zh-TW"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
