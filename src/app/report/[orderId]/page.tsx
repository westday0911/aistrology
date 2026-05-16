"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Sparkles, Printer, ArrowLeft, Calendar, Clock, MapPin, Heart, RefreshCcw } from "lucide-react";
import Link from "next/link";

// Lightweight Markdown → HTML parser
function parseMarkdown(text: string): string {
  if (!text) return "";
  return text
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/^### (.+)$/gm, "<h3 class='text-lg font-bold text-white mt-6 mb-2'>$1</h3>")
    .replace(/^## (.+)$/gm, "<h2 class='text-xl font-bold text-purple-300 mt-8 mb-3'>$1</h2>")
    .replace(/^# (.+)$/gm, "<h1 class='text-2xl font-bold text-white mt-8 mb-4'>$1</h1>")
    .replace(/^- (.+)$/gm, "<li class='ml-4 list-disc text-slate-300'>$1</li>")
    .replace(/\n\n/g, "</p><p class='mt-4'>")
    .replace(/\n/g, "<br />");
}

function RichText({ content, className }: { content: string; className?: string }) {
  return (
    <div
      className={className}
      dangerouslySetInnerHTML={{ __html: `<p class='mt-0'>${parseMarkdown(content)}</p>` }}
    />
  );
}

export default function ReportPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.orderId as string;
  const [reportStore, setReportStore] = useState<any>(null);
  const [userInfo, setUserInfo] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(5);

  const report = activeTab ? reportStore?.[activeTab] : null;
  
  // 🌟 Use Ref to track if the user has already landed on a tab, avoiding stale closures
  const hasSetInitialTab = useRef(false);

  useEffect(() => {
    let pollInterval: NodeJS.Timeout;

    async function fetchReport() {
      try {
        const res = await fetch(`/api/report/${orderId}`);
        const data = await res.json();
        
        if (data.user_info) setUserInfo(data.user_info);

        if (data.status === "GENERATING" || data.status === "PARTIAL_READY") {
          setIsGenerating(true);
          setLoading(false);
          const content = data.report_content || {};
          setReportStore(content);

          // Only set initial tab ONCE. Don't jump if user is already reading
          if (!hasSetInitialTab.current) {
            const keys = Object.keys(content).filter(k => !k.startsWith('_')).sort((a, b) => {
              const order: Record<string, number> = { bundle: 0, yearly: 1, love: 2, career: 3 };
              return (order[a] ?? 9) - (order[b] ?? 9);
            });
            if (keys.length > 0) {
              setActiveTab(keys[0]);
              hasSetInitialTab.current = true;
            }
          }

          pollInterval = setTimeout(fetchReport, 5000);
        } else if (data.status === "READY") {
          setReportStore(data.report_content || {});
          setIsGenerating(false);
          setLoading(false);

          if (!hasSetInitialTab.current) {
            const keys = Object.keys(data.report_content || {}).sort((a, b) => {
              const order: Record<string, number> = { bundle: 0, yearly: 1, love: 2, career: 3 };
              return (order[a] ?? 9) - (order[b] ?? 9);
            });
            if (keys.length > 0) {
              setActiveTab(keys[0]);
              hasSetInitialTab.current = true;
            }
          }
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
  }, [orderId]);

  // 🌟 Virtual Progress Timer for Paid Report (Slow crawl for 6-10 mins)
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isGenerating && !report) {
      interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 99) return prev;
          // 極慢增長：前 30% 稍快，後面每 3 秒增加 0.1% ~ 0.3%
          const increment = prev < 30 ? 0.5 : 0.1 + Math.random() * 0.2;
          return Math.min(99, prev + increment);
        });
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [isGenerating, report]);

  const handleRegenerate = async () => {
    if (!window.confirm("系統將跳過已完成的章節，從中斷的地方繼續生成報告。確定要繼續嗎？")) return;
    
    setLoading(true);
    try {
      const res = await fetch(`/api/report/${orderId}/regenerate`, { method: "POST" });
      if (res.ok) {
        window.location.reload();
      } else {
        alert("重新生成失敗，請稍後再試");
        setLoading(false);
      }
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

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

  // 2. Generating State (Only if NO report content is ready yet)
  if (isGenerating && !report) {
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
              AI 占師正為您閉關撰寫
            </h2>
            <div className="space-y-2">
              <p className="text-slate-400 text-sm leading-relaxed">
                這是一份超過萬字的深度解析，AI 正在分析您的行星相位與宮位聯結，請稍候 6-10 分鐘讓智慧完全顯化。
              </p>
              
              <div className="pt-6 px-4 space-y-4">
                {/* Progress Bar Container */}
                <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden relative">
                  <motion.div 
                    initial={{ width: "5%" }}
                    animate={{ width: `${progress}%` }}
                    className="absolute top-0 left-0 h-full bg-gradient-to-r from-purple-600 via-pink-500 to-purple-600 shadow-[0_0_15px_rgba(168,85,247,0.5)]"
                  />
                </div>
                
                <div className="flex justify-between items-center">
                   <p className="text-[10px] text-purple-400/80 uppercase tracking-[0.2em] animate-pulse">
                    {reportStore?._progress?.message || "靈靈能量同步中..."}
                  </p>
                  <span className="text-[10px] font-black text-slate-600 tracking-widest">
                    {Math.round(progress)}%
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-center gap-3">
             <div className="w-1.5 h-1.5 bg-purple-500/40 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
             <div className="w-1.5 h-1.5 bg-purple-500/40 rounded-full animate-bounce" style={{ animationDelay: '200ms' }} />
             <div className="w-1.5 h-1.5 bg-purple-500/40 rounded-full animate-bounce" style={{ animationDelay: '400ms' }} />
          </div>

          <p className="text-[10px] text-slate-600">
            完成後系統會自動為您開啟，或請檢查您的電子信箱。
          </p>
        </div>
      </div>
    );
  }

  // 3. Normal view (if report is ready OR partially ready)
  if (!report) {
     return (
       <div className="min-h-screen bg-[#030305] flex items-center justify-center">
          <p className="text-slate-500">找不到報告內容</p>
       </div>
     );
  }

  return (
    <div className="min-h-screen bg-[#030305] text-slate-200 pb-20 selection:bg-purple-500/30">
      {/* 🌟 Background Progress Banner */}
      {isGenerating && (
        <div className="sticky top-0 z-50 w-full bg-purple-900/40 backdrop-blur-md border-b border-purple-500/30 py-2 px-6 flex items-center justify-center gap-3">
          <RefreshCcw className="w-3 h-3 text-purple-400 animate-spin" />
          <span className="text-[10px] text-purple-200 font-bold tracking-widest uppercase">
            智慧同步中：{reportStore?._progress?.message || "正在生成其他章節..."}
          </span>
        </div>
      )}
      <div className="max-w-4xl mx-auto px-6 pt-12 pb-8">
        <div className="flex justify-between items-center mb-12 print:hidden">
          <button onClick={() => router.back()} className="text-slate-400 hover:text-white transition-colors flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" /> 返回
          </button>
          <div className="flex items-center gap-3">
            <button 
              onClick={handleRegenerate} 
              className="px-4 py-2 bg-purple-500/10 border border-purple-500/20 rounded-full text-xs font-bold text-purple-400 hover:bg-purple-500/20 transition-all flex items-center gap-2"
            >
              <RefreshCcw className="w-3 h-3" /> 重新生成
            </button>
            <button onClick={() => window.print()} className="px-4 py-2 bg-white/5 border border-white/10 rounded-full text-xs font-bold hover:bg-white/10 transition-all flex items-center gap-2">
              <Printer className="w-4 h-4" /> 列印 / 儲存 PDF
            </button>
          </div>
        </div>

        {reportStore && Object.keys(reportStore).filter(k => k !== '_lock').length > 1 && (() => {
          const tabKeys = Object.keys(reportStore)
            .filter(k => k !== '_lock')
            .sort((a, b) => {
              const order: Record<string, number> = { bundle: 0, yearly: 1, love: 2, career: 3 };
              return (order[a] ?? 9) - (order[b] ?? 9);
            });
          return (
            <div className="flex justify-center gap-2 mb-12 p-1 bg-white/5 border border-white/10 rounded-2xl w-fit mx-auto print:hidden flex-wrap">
              {tabKeys.map((key) => (
                <button
                  key={key}
                  onClick={() => setActiveTab(key)}
                  className={`px-6 py-2 rounded-xl text-sm font-bold transition-all relative ${
                    activeTab === key 
                      ? "bg-purple-600 text-white shadow-lg shadow-purple-500/20" 
                      : "text-slate-400 hover:text-white hover:bg-white/5"
                  }`}
                >
                  {key === "bundle" ? "靈魂全書" :
                   key === "yearly" ? "年度專書" : 
                   key === "love" ? "愛情報告" : 
                   key === "career" ? "事業地圖" : key}

                  {/* Subtle pulsing dot on incomplete tabs */}
                  {isGenerating && !reportStore[key]?.isComplete && (
                    <span className="absolute -top-1 -right-1 w-2 h-2 bg-purple-400 rounded-full animate-pulse shadow-sm shadow-purple-500/50" />
                  )}
                </button>
              ))}
            </div>
          );
        })()}

        {/* Report Cover / Title */}
        <div className="text-center space-y-6 mb-20">
          <div className="inline-block px-4 py-1 bg-purple-600/20 border border-purple-500/30 rounded-full text-[10px] font-bold tracking-[0.3em] text-purple-400 uppercase">
            Personal Soul Guide
          </div>

          {/* 🌟 User Info Badge */}
          {userInfo && (
            <div className="flex flex-col items-center gap-2 mb-8">
              <h3 className="text-2xl font-bold text-white mb-2">
                {userInfo.name} 的專屬星書
              </h3>
              <div className="flex flex-wrap justify-center gap-4 text-xs text-slate-400 bg-white/5 px-6 py-3 rounded-2xl border border-white/10">
                <div className="flex items-center gap-2">
                  <Calendar className="w-3 h-3 text-purple-400" />
                  {userInfo.birth_data?.birthDate || userInfo.birth_data?.date}
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-3 h-3 text-purple-400" />
                  {userInfo.birth_data?.birthTime || userInfo.birth_data?.time}
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-3 h-3 text-purple-400" />
                  {userInfo.birth_data?.location || "未知地點"}
                </div>
              </div>
            </div>
          )}

          <h1 className="text-4xl md:text-6xl font-black tracking-tight text-white leading-tight">
            {report.title}
          </h1>
          <p className="text-xl text-slate-400 italic max-w-2xl mx-auto leading-relaxed">
            {report.intro}
          </p>
        </div>

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
              <RichText
                content={report.yearly_theme.analysis}
                className="text-lg leading-relaxed text-slate-300"
              />
            </div>
          </div>
        )}

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
                    <RichText content={m.details} className="text-slate-300 leading-relaxed text-lg" />
                    {m.warnings && (
                      <div className="bg-pink-500/5 border border-pink-500/20 rounded-2xl p-6">
                        <div className="flex items-center gap-2 text-pink-400 font-bold mb-3 uppercase tracking-widest text-[10px]">
                          <Clock className="w-4 h-4" /> 月度警示與避坑
                        </div>
                        <RichText content={m.warnings} className="text-pink-200/80 text-sm leading-relaxed" />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Sections: only show for non-bundle reports (love/career) */}
        {report.sections && !report.thematic_analysis && (
          <div className="space-y-12 mb-20">
            {report.sections.map((section: any, idx: number) => (
              <div key={idx} className="space-y-6">
                <h2 className="text-2xl font-bold text-white border-l-4 border-purple-500 pl-4">
                  {section.title}
                </h2>
                <div className="glass-card p-8 md:p-10">
                  <RichText content={section.content} className="text-lg leading-relaxed text-slate-300" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 4. Thematic Deep Dives + Q&A (Bundle) */}
        {report.thematic_analysis && (
          <div className="space-y-16 mb-20">
            {report.thematic_analysis.career && (
              <div className="space-y-6">
                <h2 className="text-3xl font-black text-white flex items-center gap-4">
                  <MapPin className="w-8 h-8 text-emerald-500" /> 事業與財富：擴張的軌跡
                </h2>
                <div className="glass-card p-8 md:p-10">
                  <RichText content={report.thematic_analysis.career} className="text-lg leading-relaxed text-slate-300" />
                </div>
              </div>
            )}
            {report.thematic_analysis.love && (
              <div className="space-y-6">
                <h2 className="text-3xl font-black text-white flex items-center gap-4">
                  <Heart className="w-8 h-8 text-pink-500" /> 愛情與人際：心靈的連結
                </h2>
                <div className="glass-card p-8 md:p-10">
                  <RichText content={report.thematic_analysis.love} className="text-lg leading-relaxed text-slate-300" />
                </div>
              </div>
            )}
            {report.thematic_analysis.health && (
              <div className="space-y-6">
                <h2 className="text-3xl font-black text-white flex items-center gap-4">
                  <Sparkles className="w-8 h-8 text-blue-500" /> 身心靈與成長：內在的修復
                </h2>
                <div className="glass-card p-8 md:p-10">
                  <RichText content={report.thematic_analysis.health} className="text-lg leading-relaxed text-slate-300" />
                </div>
              </div>
            )}
            {/* Q&A sections merged directly into Soul Book */}
            {report.sections?.map((section: any, idx: number) => (
              <div key={idx} className="space-y-6">
                <h2 className="text-3xl font-black text-white flex items-center gap-4">
                  <Sparkles className="w-8 h-8 text-purple-400" />
                  {section.title}
                </h2>
                <div className="glass-card p-8 md:p-10 border border-purple-500/20">
                  <RichText content={section.content} className="text-lg leading-relaxed text-slate-300" />
                </div>
              </div>
            ))}
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
