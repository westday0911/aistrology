"use client";

import { motion } from "framer-motion";
import { Sparkles, ArrowLeft, Star, Heart, Briefcase, Zap, ShieldCheck } from "lucide-react";
import Link from "next/link";

export default function DemoReportPage() {
  return (
    <main className="min-h-screen bg-[#050508] text-slate-200 py-12 px-6 relative overflow-hidden">
      {/* Background Decorations */}
      <div className="star-field" />
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-purple-500/10 blur-[120px] rounded-full -z-10" />
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-pink-500/10 blur-[120px] rounded-full -z-10" />

      <div className="max-w-4xl mx-auto space-y-12 relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-8">
          <Link href="/chart" className="flex items-center gap-2 text-slate-500 hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4" />
            返回星盤
          </Link>
          <div className="text-right">
            <div className="px-3 py-1 bg-purple-500 text-white text-[10px] font-black rounded-full inline-block mb-2">PRO FULL REPORT</div>
            <h1 className="text-3xl font-black bg-gradient-to-r from-white to-slate-500 bg-clip-text text-transparent">個人靈魂生命全書</h1>
          </div>
        </div>

        {/* Introduction Section */}
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-10 space-y-6"
        >
          <div className="flex items-center gap-4 text-purple-400">
            <Star className="w-6 h-6" />
            <h2 className="text-xl font-bold uppercase tracking-widest">前言：靈魂的藍圖</h2>
          </div>
          <p className="text-slate-400 leading-relaxed italic">
            「在您出生的那一刻，星辰的位置交織成了一幅獨一無二的圖騰。這份報告不僅僅是數據的堆疊，而是 AI 結合占星智慧，為您解碼生命中潛藏的無限可能...」
          </p>
          <p className="text-slate-300 leading-relaxed">
            透過您的星盤，我們觀察到太陽位於第一宮與木星形成的強力三分相，這賦予了您與生俱來的自信與樂觀精神。然而，土星在第八宮的考驗則提醒您，在深層的情感轉化與共同財富管理上，需要更多的耐心與紀律。
          </p>
        </motion.section>

        {/* Career Section */}
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-6"
        >
          <div className="flex items-center gap-4 text-emerald-400">
            <Briefcase className="w-6 h-6" />
            <h2 className="text-xl font-bold uppercase tracking-widest">事業與財富：高峰的登頂</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="glass-card p-8 bg-emerald-500/5 border-emerald-500/20">
              <h3 className="font-bold mb-4 flex items-center gap-2">
                <Zap className="w-4 h-4 text-emerald-400" />
                事業天賦分析
              </h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                您的第十宮（官祿宮）落在摩羯座，顯示出您在職場上擁有極強的穩定性與領導潛力。您不適合短期投機的工作，反而能在需要長期耕耘、制度化的環境中脫穎而出。AI 建議您可以朝向管理、建築、法律或高等教育領域發展。
              </p>
            </div>
            <div className="glass-card p-8 bg-blue-500/5 border-blue-500/20">
              <h3 className="font-bold mb-4 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-blue-400" />
                財富累積建議
              </h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                第二宮的太陽顯示出您的金錢觀與自我價值感高度掛鉤。您渴望透過創造價值來換取豐厚的物質回報。未來一年，隨著木星進入您的第二宮，這是一個極佳的財富擴張期，適合進行長期資產配置。
              </p>
            </div>
          </div>
        </motion.section>

        {/* Love Section */}
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card p-10 space-y-6 border-pink-500/20"
        >
          <div className="flex items-center gap-4 text-pink-400">
            <Heart className="w-6 h-6" />
            <h2 className="text-xl font-bold uppercase tracking-widest">感情與宿命：愛的深層連結</h2>
          </div>
          <p className="text-slate-300 leading-relaxed">
            金星位於雙子座並與海王星形成刑相，這使得您的愛情充滿了夢幻與理想主義色彩。您渴望靈魂層面的交流，但也容易在感情中過於理想化對方。
          </p>
          <div className="p-6 bg-pink-500/5 rounded-2xl border border-pink-500/10">
            <h4 className="text-sm font-bold text-pink-300 mb-2">💡 桃花預測</h4>
            <p className="text-sm text-slate-400 leading-relaxed">
              根據流年推算，今年秋季當火星經過您的第七宮時，將有一段強烈的正緣連結。這段關係可能會由朋友介紹或在專業社交場合中出現，建議保持開放的心態。
            </p>
          </div>
        </motion.section>

        {/* User Specific Questions Section (Demo) */}
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="space-y-6"
        >
          <div className="flex items-center gap-4 text-purple-400">
            <Sparkles className="w-6 h-6" />
            <h2 className="text-xl font-bold uppercase tracking-widest">您的專屬問題解答</h2>
          </div>
          <div className="space-y-4">
            <div className="glass-card p-8 bg-purple-500/5 border-purple-500/20">
              <div className="text-xs text-purple-300 font-bold mb-2">Q: 我最近適合轉職嗎？</div>
              <p className="text-sm text-slate-400 leading-relaxed">
                A: 考慮到目前天王星正對沖您的第六宮工作宮，這是一個充滿變動的訊號。雖然您感到焦躁，但這其實是突破僵局的好機會。建議在三個月後，待土星順行後再進行實際的行動。
              </p>
            </div>
            <div className="glass-card p-8 bg-purple-500/5 border-purple-500/20">
              <div className="text-xs text-purple-300 font-bold mb-2">Q: 我的另一半會是什麼樣的人？</div>
              <p className="text-sm text-slate-400 leading-relaxed">
                A: 您的第七宮宮頭為獅子座，預示著您的伴侶可能具備強烈的領袖氣質、慷慨且熱情。對方可能是在舞台上、或者是具有公眾影響力的人物。
              </p>
            </div>
          </div>
        </motion.section>

        {/* Footer */}
        <div className="text-center pt-12 pb-20 space-y-4">
          <p className="text-slate-500 text-xs italic">* 以上內容由 Aistrology AI 根據您的星盤大數據動態生成 *</p>
          <Link href="/chart" className="inline-block px-8 py-3 bg-white/5 border border-white/10 rounded-xl text-sm font-bold hover:bg-white/10 transition-all">
            返回星盤首頁
          </Link>
        </div>
      </div>
    </main>
  );
}
