import { Metadata } from "next";
import BirthForm from "@/components/BirthForm";
import { Sparkles } from "lucide-react";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "免費星盤解析 | AI 賦能的現代占星體驗",
  description: "即刻輸入您的出生資訊，獲取由精準星曆與 AI 共同產出的免費個人星盤摘要。探索您的內在性格、潛能與靈魂方向。",
};

export default function Home() {
  return (
    <main className="min-h-screen relative flex flex-col items-center justify-center p-6 md:p-24 overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="star-field" />
      <div className="absolute top-0 left-0 w-full h-full cosmic-gradient -z-10" />
      
      {/* Animated Orbs */}
      <div className="absolute top-1/4 -left-20 w-64 h-64 bg-purple-600/20 blur-[100px] rounded-full animate-pulse" />
      <div className="absolute bottom-1/4 -right-20 w-64 h-64 bg-pink-600/20 blur-[100px] rounded-full animate-pulse delay-1000" />

      {/* Header / Logo Section */}
      <div className="mb-12 text-center relative">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-purple-300 mb-4 backdrop-blur-sm">
          <Sparkles className="w-3 h-3" />
          <span>AI 賦能的現代占星體驗</span>
        </div>
        <h1 className="text-5xl md:text-7xl font-black tracking-tighter mb-4">
          AI<span className="text-purple-500">STROLOGY</span>
        </h1>
        <div className="h-1 w-20 bg-gradient-to-r from-purple-500 to-pink-500 mx-auto rounded-full" />
      </div>

      {/* Main Content */}
      <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <div className="hidden lg:block space-y-6">
          <h2 className="text-4xl font-bold leading-tight">
            探索你的<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400">
              靈魂藍圖
            </span>
          </h2>
          <p className="text-slate-400 text-lg leading-relaxed">
            透過先進的星曆計算與 AI 深度解析，我們為您揭開星空下的秘密。不只是行星的排列，更是關於您生命意義的深刻洞察。
          </p>
          
          <div className="flex gap-4">
            <div className="flex -space-x-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="w-10 h-10 rounded-full border-2 border-[#050508] bg-slate-800" />
              ))}
            </div>
            <div className="text-sm text-slate-400">
              <span className="text-white font-bold">1,200+</span> 人已獲取他們的星盤報告
            </div>
          </div>
        </div>

        <BirthForm />
      </div>

      <Footer className="absolute bottom-8" />
    </main>
  );
}
