"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Sparkles, Printer, ArrowLeft, Calendar, Clock, MapPin, Heart } from "lucide-react";
import Link from "next/link";

export default function ReportPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.orderId as string;
  const [reportStore, setReportStore] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    let pollInterval: NodeJS.Timeout;

    async function fetchReport() {
      try {
        const res = await fetch(`/api/report/${orderId}`);
        const data = await res.json();
        
        if (data.status === "GENERATING") {
          setIsGenerating(true);
          setLoading(false);
          // Poll again in 5 seconds
          pollInterval = setTimeout(fetchReport, 5000);
        } else if (data.status === "READY") {
          setReportStore(data.report_content || {});
          setIsGenerating(false);
          setLoading(false);
          // Set initial active tab if not set (Prioritize bundle)
          const keys = Object.keys(data.report_content || {}).sort((a, b) => {
            if (a === "bundle") return -1;
            if (b === "bundle") return 1;
            return 0;
          });
          if (keys.length > 0 && !activeTab) setActiveTab(keys[0]);
        } else {
          console.error("Report error:", data.error);
          setLoading(false);
        }
      } catch (err) {
        console.error("Fetch error:", err);
        setLoading(false);
      }
    }

    if (orderId) fetchReport();

    return () => clearTimeout(pollInterval);
  }, [orderId, activeTab]);

  const report = activeTab ? reportStore?.[activeTab] : null;

  // 1. Loading State (Full Screen)
  if (loading) {
    return (
      <div className="min-h-screen bg-[#030305] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-2 border-purple-500/20 border-t-purple-500 rounded-full animate-spin" />
          <p className="text-slate-500 text-xs tracking-widest uppercase animate-pulse">正在讀取星空訊息...</p>
        </div>
      </div>
    );
  }

  // 2. Generating State (Premium Animation)
  if (isGenerating || !report) {
    return (
      <div className="min-h-screen bg-[#030305] flex items-center justify-center p-6 text-center overflow-hidden relative">
        {/* Background Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[120px]" />
        
        <div className="space-y-10 max-w-md relative z-10">
          {/* Animated Crystal Ball / Orb */}
          <div className="relative w-32 h-32 mx-auto">
            <motion.div
              animate={{ 
                scale: [1, 1.1, 1],
                opacity: [0.5, 0.8, 0.5]
              }}
              transition={{ duration: 4, repeat: Infinity }}
              className="absolute inset-0 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full blur-xl opacity-50"
            />
            <div className="absolute inset-2 bg-[#0a0a0f] rounded-full border border-white/10 flex items-center justify-center">
              <Sparkles className="w-10 h-10 text-purple-400 animate-pulse" />
            </div>
            {/* Orbital Ring */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
              className="absolute -inset-4 border-t-2 border-l-2 border-purple-500/30 rounded-full"
            />
          </div>

          <div className="space-y-4">
            <h2 className="text-3xl font-black bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
              {isGenerating ? "AI 占師正為您閉關撰寫" : "報告讀取中"}
            </h2>
            <div className="space-y-2">
              <p className="text-slate-400 text-sm leading-relaxed">
                這是一份超過萬字的深度解析，AI 正在分析您的行星相位與宮位聯結，請稍候 30-60 秒讓智慧完全顯化。
              </p>
              <p className="text-[10px] text-purple-400/60 uppercase tracking-[0.2em] animate-pulse">
                撰寫進度：靈魂能量同步中...
              </p>
            </div>
          </div>

          <div className="flex justify-center gap-3">
             <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
             <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '200ms' }} />
             <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '400ms' }} />
          </div>

          <p className="text-[10px] text-slate-600">
            完成後系統會自動為您開啟，或請檢查您的電子信箱。
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#030305] text-slate-200 pb-20 selection:bg-purple-500/30">
      {/* Header Container */}
      <div className="max-w-4xl mx-auto px-6 pt-12 pb-8">
        <div className="flex justify-between items-center mb-12 print:hidden">
          <button onClick={() => router.back()} className="text-slate-400 hover:text-white transition-colors flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" /> 返回
          </button>
          <button onClick={() => window.print()} className="px-4 py-2 bg-white/5 border border-white/10 rounded-full text-xs font-bold hover:bg-white/10 transition-all flex items-center gap-2">
            <Printer className="w-4 h-4" /> 列印 / 儲存 PDF
          </button>
        </div>

        {/* Report Selector Tabs (Only show if multiple reports exist) */}
        {reportStore && Object.keys(reportStore).length > 1 && (
          <div className="flex justify-center gap-2 mb-12 p-1 bg-white/5 border border-white/10 rounded-2xl w-fit mx-auto print:hidden">
            {Object.keys(reportStore)
              .sort((a, b) => {
                // Ensure bundle is always first
                if (a === "bundle") return -1;
                if (b === "bundle") return 1;
                return 0;
              })
              .map((key) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${
                  activeTab === key 
                    ? "bg-purple-600 text-white shadow-lg shadow-purple-500/20" 
                    : "text-slate-400 hover:text-white hover:bg-white/5"
                }`}
              >
                {key === "bundle" ? "靈魂全書" :
                 key === "yearly" ? "年度專書" : 
                 key === "love" ? "愛情報告" : 
                 key === "career" ? "事業地圖" : "專屬解析"}
              </button>
            ))}
          </div>
        )}

        {/* Report Cover / Title */}
        <div className="text-center space-y-6 mb-20">
          <div className="inline-block px-4 py-1 bg-purple-600/20 border border-purple-500/30 rounded-full text-[10px] font-bold tracking-[0.3em] text-purple-400 uppercase">
            Personal Soul Guide
          </div>
          <h1 className="text-4xl md:text-6xl font-black tracking-tight text-white leading-tight">
            {report.title}
          </h1>
          <p className="text-xl text-slate-400 italic max-w-2xl mx-auto leading-relaxed">
            {report.intro}
          </p>
        </div>

        {/* 1. Yearly Theme Section (If exists) */}
        {report.yearly_theme && (
          <div className="glass-card p-8 md:p-12 mb-16 border-l-8 border-l-purple-600">
            <div className="flex items-center gap-3 mb-6">
              <Sparkles className="w-6 h-6 text-purple-400" />
              <h2 className="text-2xl font-bold text-white">年度核心命題</h2>
            </div>
            <div className="space-y-6">
              <div className="inline-block px-6 py-2 bg-white text-[#030305] font-black text-xl rounded-lg transform -rotate-1 shadow-xl">
                關鍵字：{report.yearly_theme.keyword}
              </div>
              <div className="text-lg leading-relaxed text-slate-300 whitespace-pre-wrap">
                {report.yearly_theme.analysis}
              </div>
            </div>
          </div>
        )}

        {/* 2. 12 Months Grid (If exists) */}
        {report.monthly_forecasts && (
          <div className="space-y-8 mb-20">
            <h2 className="text-3xl font-black text-white mb-8 border-b border-white/10 pb-4 flex items-center gap-4">
              <Calendar className="w-8 h-8 text-pink-500" />
              時光軌跡詳解
            </h2>
            <div className="grid grid-cols-1 gap-8">
              {report.monthly_forecasts.map((m: any, idx: number) => (
                <div key={idx} className="glass-card p-8 relative overflow-hidden group hover:border-purple-500/30 transition-all">
                  <div className="absolute -right-4 -top-8 text-9xl font-black text-white/[0.03] pointer-events-none group-hover:text-purple-500/[0.05] transition-colors">
                    {idx + 1}
                  </div>
                  <div className="relative z-10 space-y-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-3xl font-black text-white">{m.month}</h3>
                      <div className="px-3 py-1 bg-purple-500/10 rounded-full text-xs font-bold text-purple-400 border border-purple-500/20">
                        {m.focus}
                      </div>
                    </div>
                    <p className="text-slate-300 leading-relaxed text-lg">
                      {m.details}
                    </p>
                    {m.warnings && (
                      <div className="bg-pink-500/5 border border-pink-500/20 rounded-2xl p-6">
                        <div className="flex items-center gap-2 text-pink-400 font-bold mb-3 uppercase tracking-widest text-[10px]">
                          <Clock className="w-4 h-4" /> 月度警示與避坑
                        </div>
                        <div className="text-pink-200/80 text-sm leading-relaxed whitespace-pre-wrap">
                          {m.warnings}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 3. General Sections (For Love, Career or Other types) */}
        {report.sections && (
          <div className="space-y-12 mb-20">
            {report.sections.map((section: any, idx: number) => (
              <div key={idx} className="space-y-6">
                <h2 className="text-2xl font-bold text-white border-l-4 border-purple-500 pl-4">
                  {section.title}
                </h2>
                <div className="glass-card p-8 md:p-10 text-lg leading-relaxed text-slate-300 whitespace-pre-wrap">
                  {section.content}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 4. Thematic Deep Dives (For Bundle/Yearly) */}
        {report.thematic_analysis && (
          <div className="space-y-16 mb-20">
            {report.thematic_analysis.career && (
              <div className="space-y-6">
                <h2 className="text-3xl font-black text-white flex items-center gap-4">
                  <MapPin className="w-8 h-8 text-emerald-500" /> 事業與財富：擴張的軌跡
                </h2>
                <div className="glass-card p-8 md:p-10 text-lg leading-relaxed text-slate-300 whitespace-pre-wrap">
                  {report.thematic_analysis.career}
                </div>
              </div>
            )}
            {report.thematic_analysis.love && (
              <div className="space-y-6">
                <h2 className="text-3xl font-black text-white flex items-center gap-4">
                  <Heart className="w-8 h-8 text-pink-500" /> 愛情與人際：心靈的連結
                </h2>
                <div className="glass-card p-8 md:p-10 text-lg leading-relaxed text-slate-300 whitespace-pre-wrap">
                  {report.thematic_analysis.love}
                </div>
              </div>
            )}
            {report.thematic_analysis.health && (
              <div className="space-y-6">
                <h2 className="text-3xl font-black text-white flex items-center gap-4">
                  <Sparkles className="w-8 h-8 text-blue-500" /> 身心靈與成長：內在的修復
                </h2>
                <div className="glass-card p-8 md:p-10 text-lg leading-relaxed text-slate-300 whitespace-pre-wrap">
                  {report.thematic_analysis.health}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Lucky Guide Footer */}
        {report.lucky_guide && (
          <div className="bg-gradient-to-br from-purple-900/40 to-indigo-900/40 border border-purple-500/30 rounded-[2rem] p-8 md:p-12 text-center space-y-8">
            <h2 className="text-2xl font-bold text-white">年度宇宙守護</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-3">
                <div className="text-slate-500 text-xs font-bold uppercase tracking-widest">幸運顏色</div>
                <div className="flex justify-center gap-3">
                  {report.lucky_guide.colors?.map((c: string) => (
                    <span key={c} className="px-4 py-2 bg-white/5 rounded-full text-sm font-bold text-white border border-white/10">
                      {c}
                    </span>
                  ))}
                </div>
              </div>
              <div className="space-y-3">
                <div className="text-slate-500 text-xs font-bold uppercase tracking-widest">關鍵日期</div>
                <div className="flex justify-center gap-3">
                  {report.lucky_guide.dates?.map((d: string) => (
                    <span key={d} className="px-4 py-2 bg-white/5 rounded-full text-sm font-bold text-pink-400 border border-white/10">
                      {d}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            <div className="pt-8 border-t border-white/10">
              <div className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-4">年度守護金句</div>
              <p className="text-2xl md:text-4xl font-serif italic text-purple-200">
                "{report.lucky_guide.mantra}"
              </p>
            </div>
          </div>
        )}
        {/* Footer */}
        <footer className="mt-32 pb-8 flex flex-col items-center gap-2 border-t border-white/5 pt-12 print:hidden">
          <div className="text-slate-600 text-[10px] uppercase tracking-[0.2em]">
            &copy; 2026 AISTROLOGY &bull; Precision Ephemeris &bull; AI Insight
          </div>
          <a 
            href="https://www.doris-school.com" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-xs font-medium text-slate-400 hover:text-purple-400 transition-colors"
          >
            由 <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent font-bold">Doris AI 學院</span> 開發
          </a>
        </footer>
      </div>
    </div>
  );
}
