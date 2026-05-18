import { Metadata } from "next";
import BirthForm from "@/components/BirthForm";
import { Sparkles, Sun, Moon, Compass, Sparkle, Heart, Brain, Cpu, MessageSquare } from "lucide-react";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "免費星盤解析 | AI 賦能的現代占星體驗",
  description: "即刻輸入您的出生資訊，獲取由精準星曆與 AI 共同產出的免費個人星盤摘要。探索您的內在性格、潛能與靈魂方向。",
};

export default function Home() {
  return (
    <main className="min-h-screen relative flex flex-col items-center p-6 md:py-20 md:px-12 overflow-x-hidden overflow-y-auto">
      {/* Background Decorative Elements */}
      <div className="star-field" />
      <div className="absolute top-0 left-0 w-full h-full cosmic-gradient -z-10" />
      
      {/* Animated Orbs */}
      <div className="absolute top-1/4 -left-20 w-64 h-64 bg-purple-600/20 blur-[100px] rounded-full animate-pulse" />
      <div className="absolute bottom-1/4 -right-20 w-64 h-64 bg-pink-600/20 blur-[100px] rounded-full animate-pulse delay-1000" />

      {/* Header / Logo Section */}
      <div className="mb-12 text-center relative mt-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-purple-300 mb-4 backdrop-blur-sm">
          <Sparkles className="w-3 h-3" />
          <span>AI 賦能的現代占星體驗</span>
        </div>
        <h1 className="text-5xl md:text-7xl font-black tracking-tighter mb-4">
          AI<span className="text-purple-500">STROLOGY</span>
        </h1>
        <div className="h-1 w-20 bg-gradient-to-r from-purple-500 to-pink-500 mx-auto rounded-full" />
      </div>

      {/* Main Content Form Section */}
      <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-24">
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
                <div 
                  key={i} 
                  className={`w-10 h-10 rounded-full border-2 border-[#050508] bg-gradient-to-br ${
                    i === 1 ? 'from-purple-500 to-pink-500' :
                    i === 2 ? 'from-cyan-500 to-blue-500' :
                    i === 3 ? 'from-pink-500 to-rose-500' :
                    'from-amber-400 to-orange-500'
                  } flex items-center justify-center text-[10px] font-black text-white`}
                >
                  {i === 1 ? '☀️' : i === 2 ? '🌙' : i === 3 ? '♀' : '♂'}
                </div>
              ))}
            </div>
            <div className="text-sm text-slate-400 self-center">
              <span className="text-white font-bold">1,200+</span> 人已獲取他們的星盤報告
            </div>
          </div>
        </div>

        <BirthForm />
      </div>

      {/* Educational / Inspirational Guide Section */}
      <div className="w-full max-w-4xl border-t border-white/10 pt-20 pb-16 space-y-20">
        <div className="text-center space-y-4 max-w-2xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
            「你的星盤，是宇宙在你誕生那一刻的誓言」
          </h2>
          <p className="text-slate-400 leading-relaxed">
            星盤（Natal Chart）不只是一個幾何圓盤，它是你投生地球那一瞬間，天空星體位置的精確投影。它如同一張心靈的「出廠說明書」，記錄了你最深層的個性特質、潛意識想法與一生的能量起伏。
          </p>
        </div>

        {/* 3 Golden Keys Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Sun Sign Card */}
          <div className="glass-card p-6 bg-slate-900/30 border-white/5 hover:border-purple-500/30 transition-all duration-500 flex flex-col space-y-4 group">
            <div className="w-12 h-12 bg-amber-500/10 text-amber-400 rounded-xl flex items-center justify-center border border-amber-500/20 group-hover:scale-110 transition-transform">
              <Sun className="w-6 h-6 animate-pulse" />
            </div>
            <h3 className="text-lg font-bold text-slate-200">☀️ 太陽星座：你的靈魂羅盤</h3>
            <p className="text-slate-400 text-sm leading-relaxed flex-1">
              **主宰外在個性、自我核心與意志力**。太陽是你生命能量的發電機，代表你這輩子「想要活出的英雄樣貌」。它決定了你的自我追求、生命價值，引導你朝向榮耀的舞台邁進。
            </p>
          </div>

          {/* Moon Sign Card */}
          <div className="glass-card p-6 bg-slate-900/30 border-white/5 hover:border-pink-500/30 transition-all duration-500 flex flex-col space-y-4 group">
            <div className="w-12 h-12 bg-pink-500/10 text-pink-400 rounded-xl flex items-center justify-center border border-pink-500/20 group-hover:scale-110 transition-transform">
              <Moon className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-200">🌙 月亮星座：你的潛意識想法</h3>
            <p className="text-slate-400 text-sm leading-relaxed flex-1">
              **主宰內在情感、直覺安全感與情緒機制**。月亮是你黑夜中的指引，也是你最真實的「情緒避風港」。它揭示了你不為人知的真實需求、防衛本能，以及你如何去愛與渴望被愛。
            </p>
          </div>

          {/* Rising Sign Card */}
          <div className="glass-card p-6 bg-slate-900/30 border-white/5 hover:border-cyan-500/30 transition-all duration-500 flex flex-col space-y-4 group">
            <div className="w-12 h-12 bg-cyan-500/10 text-cyan-400 rounded-xl flex items-center justify-center border border-cyan-500/20 group-hover:scale-110 transition-transform">
              <Compass className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-200">🌌 上升星座：你的命運之門</h3>
            <p className="text-slate-400 text-sm leading-relaxed flex-1">
              **主宰人格面具、第一印象與生命探索地圖**。上升星座是你看世界的「有色濾鏡」，也是你星盤宮位的起點。它不僅決定了你給他人的第一印象，更深刻指引了你一生運勢與靈魂的探索路徑。
            </p>
          </div>
        </div>

        {/* NEW: Why AI Astrology Section */}
        <div className="space-y-10">
          <div className="text-center space-y-3 max-w-xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              為什麼選擇 AI 進行現代星盤解析？
            </h2>
            <p className="text-slate-400 text-sm leading-relaxed">
              科技與古老玄學的跨維度對話，為您帶來前所未有的個人諮詢體驗。
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Reason 1 */}
            <div className="glass-card p-6 bg-purple-950/10 border-purple-500/10 hover:border-purple-500/30 transition-all duration-500 space-y-4 flex flex-col group">
              <div className="w-10 h-10 bg-purple-500/10 text-purple-400 rounded-xl flex items-center justify-center border border-purple-500/20">
                <Cpu className="w-5 h-5 group-hover:rotate-12 transition-transform" />
              </div>
              <h4 className="font-bold text-slate-200">⚡ 毫秒級瑞士星曆精準計算</h4>
              <p className="text-slate-400 text-xs leading-relaxed flex-1">
                傳統星盤人工查閱星曆極其繁複且易出錯。我們直接與國際權威的 **瑞士星曆表（Swiss Ephemeris）** Wasm 資料庫對接，在毫秒內精確計算出您誕生那一刻天空星體的所有夾角與宮位，保證數據的絕對精準。
              </p>
            </div>

            {/* Reason 2 */}
            <div className="glass-card p-6 bg-pink-950/10 border-pink-500/10 hover:border-pink-500/30 transition-all duration-500 space-y-4 flex flex-col group">
              <div className="w-10 h-10 bg-pink-500/10 text-pink-400 rounded-xl flex items-center justify-center border border-pink-500/20">
                <Brain className="w-5 h-5 group-hover:scale-110 transition-transform" />
              </div>
              <h4 className="font-bold text-slate-200">🧠 拒絕零碎條列的高維深度合成</h4>
              <p className="text-slate-400 text-xs leading-relaxed flex-1">
                普通占星網站只給您一堆生硬、甚至自相矛盾的「條列解析」（如太陽牡羊＋月亮雙魚分開看）。我們的 **AI 占星師** 扮演了合大師級的角色，能通盤考量星體相交的化學反應，編織出**一篇連貫、有心理學深度且專屬於您的靈魂敘事**。
              </p>
            </div>

            {/* Reason 3 */}
            <div className="glass-card p-6 bg-cyan-950/10 border-cyan-500/10 hover:border-cyan-500/30 transition-all duration-500 space-y-4 flex flex-col group">
              <div className="w-10 h-10 bg-cyan-500/10 text-cyan-400 rounded-xl flex items-center justify-center border border-cyan-500/20">
                <MessageSquare className="w-5 h-5 group-hover:-translate-y-0.5 transition-transform" />
              </div>
              <h4 className="font-bold text-slate-200">🔮 隨時在線的 100% 溫暖私密諮詢</h4>
              <p className="text-slate-400 text-xs leading-relaxed flex-1">
                無需預約線下昂貴、耗時且可能有社交壓力的占星師。AI 提供了一個完全無評判、溫暖且極度隱私的心靈角落。無論深夜還是人生迷茫期，它都能隨時解答您的靈魂困惑，順應能量起伏，提供客觀的心靈避風港。
              </p>
            </div>
          </div>
        </div>

        {/* Detailed Insights Block */}
        <div className="glass-card p-8 bg-purple-500/5 border-purple-500/10 relative rounded-[2rem] overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl -z-10" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-3xl -z-10" />
          
          <div className="space-y-6 max-w-3xl mx-auto">
            <h3 className="text-xl font-bold flex items-center gap-2 text-purple-300">
              <Sparkle className="w-4 h-4 text-purple-400" />
              想法與命運，是如何在星盤中交織的？
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-slate-400 text-sm leading-relaxed">
              <div className="space-y-3">
                <h4 className="text-slate-200 font-bold flex items-center gap-1.5"><Heart className="w-3.5 h-3.5 text-pink-400" /> 內在想法的顯化</h4>
                <p>
                  星盤中的 **水星** 決定了你的心智與思考邏輯，**金星** 塑造了你對愛與美的吸引法則，而 **火星** 則是你的實踐與行動力。透過洞察行星的排列，你能理解自己為什麼常陷入某種思考迴圈，並學會調整想法、改寫人生故事。
                </p>
              </div>
              <div className="space-y-3">
                <h4 className="text-slate-200 font-bold flex items-center gap-1.5"><Sparkles className="w-3.5 h-3.5 text-cyan-400" /> 運勢能量的流轉</h4>
                <p>
                  流年運勢（Transits）是天上運行的行星與你出生星盤的精準碰撞。木星帶來擴張與機會，土星給予磨練與邊界。提前了解能量流轉的週期，能幫助你在最佳時機乘風破浪，在考驗降臨時沉澱蓄能，把命運掌握在自己手裡。
                </p>
              </div>
            </div>
            
            <div className="pt-6 border-t border-white/5 text-center">
              <p className="text-sm font-bold bg-gradient-to-r from-purple-300 via-pink-300 to-cyan-300 bg-clip-text text-transparent italic animate-pulse">
                「理解星盤，並非為了給人生畫地自限，而是去探索你靈魂無限的可能。」
              </p>
            </div>
          </div>
        </div>

        {/* Bottom CTA Block */}
        <div className="glass-card p-10 bg-gradient-to-br from-purple-900/20 via-pink-900/10 to-slate-900/40 border-purple-500/20 text-center space-y-6 relative overflow-hidden rounded-[2.5rem] shadow-xl shadow-purple-500/5">
          <div className="absolute -top-24 -left-24 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-pink-500/10 rounded-full blur-3xl" />
          
          <div className="space-y-3 max-w-xl mx-auto">
            <h3 className="text-2xl font-black text-white tracking-tight">即刻啟航，解密你的專屬靈魂星圖</h3>
            <p className="text-slate-400 text-xs leading-relaxed">
              僅需輸入出生日期、時間與地點，AI 與精準星曆表將為您即刻顯化 4000 字的深度個人靈魂解析，解開性格、想法與運勢之鎖。
            </p>
          </div>
          
          <div className="pt-2">
            <a 
              href="#birth-form-container"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold text-sm tracking-widest shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 transition-all duration-300 transform hover:-translate-y-0.5 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 animate-spin-slow" />
              立即免費生成我的專屬星盤
            </a>
          </div>
        </div>
      </div>

      <Footer className="w-full mt-12 pb-12" />
    </main>
  );
}
