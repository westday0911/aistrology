"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, ArrowLeft, Calendar, Clock, X, MessageSquare } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function ChartDisplay() {
  const [data, setData] = useState<any>(null);
  const [mounted, setMounted] = useState(false);
  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const [questions, setQuestions] = useState<string[]>([""]);
  const [activeTags, setActiveTags] = useState<string[]>([]);

  const handleQuestionChange = (index: number, value: string) => {
    const newQuestions = [...questions];
    newQuestions[index] = value;

    // If typing in the last one and it's not empty, add a new line
    if (index === newQuestions.length - 1 && value.trim() !== "") {
      newQuestions.push("");
    }

    setQuestions(newQuestions);
  };

  const [aiAnalysis, setAiAnalysis] = useState<any>(null);
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const isFetching = useRef(false);

  useEffect(() => {
    setMounted(true);
    const savedData = localStorage.getItem("astrologyData");
    if (savedData) {
      const parsed = JSON.parse(savedData);
      setData(parsed);
      
      // Cache Logic
      const cacheKey = `summary_${parsed.input.birthDate}_${parsed.input.birthTime}_${parsed.input.location}`;
      const cachedSummary = localStorage.getItem(cacheKey);

      if (cachedSummary) {
        setAiAnalysis(JSON.parse(cachedSummary));
      } else if (!isFetching.current && !aiAnalysis) {
        console.log("Fetching new AI summary...");
        isFetching.current = true;
        setIsAiGenerating(true);
        
        fetch("/api/ai/free-summary", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ chartData: parsed.results })
        })
        .then(res => res.json())
        .then(resData => {
          if (!resData.error) {
            setAiAnalysis(resData);
            localStorage.setItem(cacheKey, JSON.stringify(resData));
          }
        })
        .catch(err => console.error("AI Analysis Error:", err))
        .finally(() => {
          isFetching.current = false;
          setIsAiGenerating(false);
        });
      }
    }
  }, []);

  const planetIcons: Record<string, string> = {
    "太陽": "☀️",
    "月亮": "🌙",
    "水星": "☿",
    "金星": "♀",
    "火星": "♂",
    "木星": "♃",
    "土星": "♄",
    "天王星": "♅",
    "海王星": "♆",
    "冥王星": "♇",
    "上升星座": "ASC",
    "天頂": "MC"
  };

  const zodiacSymbols = ["牡羊", "金牛", "雙子", "巨蟹", "獅子", "處女", "天秤", "天蠍", "射手", "摩羯", "水瓶", "雙魚"];

  const planets = data?.results || [];
  const meta = data?.meta || {};
  const houses = meta.houses || [];

  // Standard astrology rotation: Put Ascendant (1st House Cusp) at 9 o'clock (180 degrees)
  const ascendant = houses[0] || 0;
  const rotationOffset = 180 - ascendant;

  const input = data?.input || { birthDate: "----/--/--", birthTime: "--:--", location: "未知地點" };

  const getPos = (longitude: number, radius: number) => {
    const angle = (longitude + rotationOffset) * (Math.PI / 180);
    return {
      x: Number((200 + radius * Math.cos(angle)).toFixed(2)),
      y: Number((200 + radius * Math.sin(angle)).toFixed(2))
    };
  };

  const quickQuestions = [
    { id: 'career_1', text: "我適合轉職嗎？", cat: "事業" },
    { id: 'love_1', text: "我的正緣何時出現？", cat: "感情" },
    { id: 'wealth_1', text: "今年財運如何？", cat: "財富" },
    { id: 'self_1', text: "我的靈魂使命是什麼？", cat: "自我" },
    { id: 'health_1', text: "需要注意健康問題嗎？", cat: "健康" },
    { id: 'home_1', text: "近期適合買房或搬家嗎？", cat: "生活" },
  ];

  const toggleTag = (text: string) => {
    setActiveTags(prev =>
      prev.includes(text) ? prev.filter(t => t !== text) : [...prev, text]
    );
  };

  const router = useRouter();

  const handleCheckout = (type: string) => {
    // Combine manual questions and active tags
    const allQuestions = [
      ...activeTags,
      ...questions.filter(q => q.trim() !== "")
    ];

    const pendingOrder = {
      birthData: input,
      chartData: {
        planets: planets,
        houses: houses,
      },
      questions: allQuestions
    };

    localStorage.setItem("pendingOrder", JSON.stringify(pendingOrder));
    router.push(`/checkout?type=${type}`);
  };

  if (!mounted) return <div className="min-h-[400px]" />;

  return (
    <div className="w-full max-w-5xl mx-auto space-y-8 pb-32">
      <div className="flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4" />
          <span>重新輸入</span>
        </Link>
        <div className="text-right">
          <h2 className="text-2xl font-bold">您的專屬靈魂藍圖</h2>
          <p className="text-slate-500 text-sm">
            {input.birthDate} {input.birthTime} · {input.location}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Dynamic SVG Chart */}
        <div className="lg:col-span-2 glass-card aspect-square flex items-center justify-center relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

          <svg viewBox="0 0 400 400" className="w-full h-full max-w-[500px]">
            {/* Outer Rings */}
            <circle cx="200" cy="200" r="180" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
            <circle cx="200" cy="200" r="150" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
            <circle cx="200" cy="200" r="100" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />

            {/* Zodiac Segments & Symbols */}
            {[...Array(12)].map((_, i) => {
              const angle = i * 30;
              const p1 = getPos(angle, 150);
              const p2 = getPos(angle, 180);
              const symbolPos = getPos(angle + 15, 165);
              return (
                <g key={i}>
                  <line x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
                  <text
                    x={symbolPos.x} y={symbolPos.y}
                    textAnchor="middle" dy=".3em"
                    className="fill-slate-400 text-[10px]"
                  >
                    {zodiacSymbols[i]}
                  </text>
                </g>
              );
            })}

            {/* House Cusps */}
            {houses.map((cusp: number, i: number) => {
              const p1 = getPos(cusp, 40);
              const p2 = getPos(cusp, 150);
              const labelPos = getPos(cusp + 15, 70); // Middle of house
              return (
                <g key={i}>
                  <line
                    x1={p1.x} y1={p1.y}
                    x2={p2.x} y2={p2.y}
                    stroke={i === 0 || i === 9 ? "rgba(168, 85, 247, 0.6)" : "rgba(255,255,255,0.2)"}
                    strokeWidth={i === 0 || i === 9 ? "2" : "1"}
                  />
                  <text
                    x={labelPos.x} y={labelPos.y}
                    textAnchor="middle" dy=".3em"
                    className="fill-purple-400/80 text-[12px] font-bold"
                  >
                    {i + 1}
                  </text>
                </g>
              );
            })}

            {/* Planet Markers */}
            {planets.map((planet: any) => {
              if (planet.name === "上升星座" || planet.name === "天頂") return null;

              const p = getPos(planet.longitude, 125);
              const outerP = getPos(planet.longitude, 150);

              return (
                <g key={planet.name} className="cursor-pointer group/planet">
                  <motion.circle
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    cx={p.x} cy={p.y} r="12"
                    className="fill-purple-600/20 stroke-purple-500/50 group-hover/planet:fill-purple-500/40 transition-all"
                  />
                  <text
                    x={p.x} y={p.y}
                    textAnchor="middle"
                    dy=".3em"
                    className="fill-white text-[12px] pointer-events-none select-none"
                  >
                    {planetIcons[planet.name] || "🪐"}
                  </text>

                  <line
                    x1={p.x} y1={p.y}
                    x2={outerP.x} y2={outerP.y}
                    stroke="rgba(168, 85, 247, 0.3)"
                    strokeWidth="1"
                    strokeDasharray="2 2"
                  />
                </g>
              );
            })}

            {/* Center decoration */}
            <circle cx="200" cy="200" r="40" fill="#050508" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
            <text x="200" y="200" textAnchor="middle" dy=".3em" className="fill-purple-400/50 text-[7px] font-bold uppercase tracking-widest">
              AISTROLOGY
            </text>
          </svg>

          {!data && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#050508]/80 backdrop-blur-sm z-10">
              <Sparkles className="w-8 h-8 text-purple-500 animate-pulse mb-2" />
              <span className="text-xs text-slate-500 uppercase tracking-widest">載入中...</span>
            </div>
          )}
        </div>

        {/* Details Section */}
        <div className="space-y-6 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
          {/* Main Points Summary (ASC/MC) */}
          <div className="grid grid-cols-2 gap-3">
            {planets.filter((p: any) => p.name === "上升星座" || p.name === "天頂").map((point: any) => (
              <div key={point.name} className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-xl">
                <div className="text-[10px] text-purple-400 uppercase font-bold tracking-wider mb-1">{point.name}</div>
                <div className="text-lg font-bold">{point.sign}</div>
                <div className="text-[10px] text-slate-500">{point.degree}</div>
              </div>
            ))}
          </div>

          {/* Planet Details */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold flex items-center gap-2 text-slate-400 uppercase tracking-widest">
              <Sparkles className="w-3 h-3 text-purple-400" />
              行星落位
            </h3>
            <div className="space-y-2">
              {planets.filter((p: any) => p.name !== "上升星座" && p.name !== "天頂").map((planet: any, i: number) => (
                <motion.div
                  key={planet.name}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-center justify-between p-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl w-8 text-center">{planetIcons[planet.name] || "🪐"}</span>
                    <div>
                      <div className="text-sm font-bold">{planet.name}</div>
                      <div className="text-[10px] text-purple-400 font-medium">{planet.house}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-slate-300 font-medium">{planet.sign}</div>
                    <div className="text-[10px] text-slate-500">{planet.degree}</div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* House Cusps Details */}
          <div className="space-y-4 pt-4 border-t border-white/5">
            <h3 className="text-sm font-bold flex items-center gap-2 text-slate-400 uppercase tracking-widest">
              <Sparkles className="w-3 h-3 text-purple-400" />
              十二宮位起始點
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {houses.map((cusp: number, i: number) => (
                <div key={i} className="flex items-center justify-between p-2 px-3 bg-white/5 rounded-lg border border-white/5">
                  <span className="text-[10px] text-slate-500 font-bold">第 {i + 1} 宮</span>
                  <span className="text-[10px] text-purple-300 font-medium">{getZodiacSign(cusp)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Free Interpretation Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="space-y-12 pt-12 border-t border-white/10 pb-20"
      >
        <div className="text-center space-y-4 max-w-2xl mx-auto">
          <h3 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            靈魂藍圖：初探你的生命密碼
          </h3>
          <div className="glass-card p-8 bg-purple-500/5 border-purple-500/20 relative group">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-purple-600 rounded-full text-[10px] font-bold tracking-widest text-white shadow-lg">
              AI REAL-TIME ANALYSIS
            </div>
            {isAiGenerating ? (
              <div className="flex flex-col items-center justify-center py-10 space-y-6">
                <div className="relative">
                  <div className="w-16 h-16 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin"></div>
                  <Sparkles className="absolute inset-0 m-auto w-6 h-6 text-purple-400 animate-pulse" />
                </div>
                <div className="space-y-2 text-center">
                  <p className="text-purple-300 font-bold tracking-[0.2em] animate-pulse uppercase text-xs">
                    正在對接星際訊號
                  </p>
                  <p className="text-slate-500 text-[10px] uppercase tracking-widest">
                    AI 正在為您解讀靈魂密碼
                  </p>
                </div>
                <div className="flex gap-1.5">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: `${i * 150}ms` }} />
                  ))}
                </div>
              </div>
            ) : aiAnalysis ? (
              <p className="text-slate-300 leading-relaxed text-lg font-medium italic">
                "{aiAnalysis.summary}"
              </p>
            ) : (
              <div className="space-y-3 opacity-50">
                <div className="h-4 bg-white/10 rounded w-full" />
                <div className="h-4 bg-white/10 rounded w-5/6 mx-auto" />
                <p className="text-[10px] text-slate-500 uppercase tracking-widest pt-4">等待啟示中...</p>
              </div>
            )}
          </div>
        </div>

        {/* 1. Personal Planets: Core Personality */}
        <div className="space-y-8">
          <div className="flex items-center gap-4">
            <h4 className="text-sm font-bold text-slate-400 uppercase tracking-[0.2em]">個人內在能量</h4>
            <div className="h-px flex-1 bg-gradient-to-l from-transparent to-white/10" />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {planets.filter((p: any) => ["太陽", "月亮", "水星", "金星", "火星"].includes(p.name)).map((planet: any) => (
              <div key={planet.name} className="glass-card p-6 border-l-4 border-l-purple-500">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 bg-purple-500/10 rounded-2xl flex items-center justify-center text-2xl shadow-inner border border-white/5">
                    {planetIcons[planet.name]}
                  </div>
                  <div>
                    <h5 className="font-bold text-white flex items-center gap-2">
                      {planet.name} <span className="text-xs text-slate-500 font-normal">入 {getZodiacSign(planet.longitude)}</span>
                    </h5>
                    <span className="text-[10px] text-purple-400 font-bold uppercase tracking-widest">{planet.house} 宮位</span>
                  </div>
                </div>
                <div className="space-y-3 text-sm text-slate-400 leading-relaxed">
                  {aiAnalysis ? (
                    <p>{aiAnalysis.planets?.[planet.name]}</p>
                  ) : (
                    <div className="flex items-center gap-2 text-purple-400/50 animate-pulse">
                      <Sparkles className="w-3 h-3" />
                      <span className="text-xs font-bold tracking-widest">AI 正在解析靈魂特質...</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 2. Outer Planets: Social & Generational */}
        <div className="space-y-8">
          <div className="flex items-center gap-4">
            <h4 className="text-sm font-bold text-slate-400 uppercase tracking-[0.2em]">社會與世代能量</h4>
            <div className="h-px flex-1 bg-gradient-to-l from-transparent to-white/10" />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {planets.filter((p: any) => ["木星", "土星", "天王星", "海王星", "冥王星"].includes(p.name)).map((planet: any) => (
              <div key={planet.name} className="glass-card p-5 bg-white/2 border-white/5 hover:border-white/10 transition-colors">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-xl">{planetIcons[planet.name]}</span>
                  <div className="font-bold text-sm">{planet.name} {getZodiacSign(planet.longitude)}</div>
                </div>
                <div className="text-sm text-slate-400 leading-relaxed">
                  {aiAnalysis ? (
                    <p>{aiAnalysis.planets?.[planet.name]}</p>
                  ) : (
                    <span className="animate-pulse opacity-50">AI 解析中...</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 3. The 12 Houses: Life Domains */}
        <div className="space-y-8">
          <div className="flex items-center gap-4">
            <h4 className="text-sm font-bold text-slate-400 uppercase tracking-[0.2em]">生命領域與駐點行星解析</h4>
            <div className="h-px flex-1 bg-gradient-to-l from-transparent to-white/10" />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(12)].map((_, i) => {
              const houseNum = i + 1;
              const planetsInHouse = planets.filter((p: any) => parseInt(p.house) === houseNum);
              const cuspSign = getZodiacSign(houses[i]);
              
              return (
                <div key={houseNum} className="glass-card p-6 relative group overflow-hidden">
                  <div className="absolute -left-2 -top-2 text-6xl font-black text-white/[0.03] group-hover:text-purple-500/[0.05] transition-colors">
                    {houseNum}
                  </div>
                  
                  <div className="relative z-10 space-y-4">
                    <div className="flex items-end justify-between border-b border-white/5 pb-2">
                      <div>
                        <span className="text-[10px] text-purple-400 font-bold uppercase tracking-widest">第 {houseNum} 宮</span>
                        <h5 className="text-xl font-bold text-slate-200">{getHouseName(houseNum)}</h5>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-slate-500 block">起始星座</span>
                        <span className="text-xs font-medium text-slate-300">{cuspSign}</span>
                      </div>
                    </div>

                    <div className="text-sm text-slate-400 leading-relaxed">
                      {aiAnalysis ? (
                        <p>{aiAnalysis.houses?.[houseNum]}</p>
                      ) : (
                        <div className="py-4 space-y-2 animate-pulse opacity-50">
                          <div className="h-3 bg-white/10 rounded w-full" />
                          <div className="h-3 bg-white/10 rounded w-4/5" />
                        </div>
                      )}
                    </div>

                    {planetsInHouse.length > 0 ? (
                      <div className="pt-4 border-t border-white/5 space-y-4">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">宮內行星影響</span>
                        <div className="space-y-3">
                          {planetsInHouse.map((p: any) => (
                            <div key={p.name} className="space-y-1.5">
                              <div className="flex items-center gap-1.5 px-2 py-1 bg-white/5 rounded-lg border border-white/5 w-fit">
                                <span className="text-xs">{planetIcons[p.name]}</span>
                                <span className="text-[10px] font-medium text-slate-400">{p.name}</span>
                              </div>
                              <p className="text-[11px] text-slate-500 leading-relaxed">
                                {aiAnalysis ? aiAnalysis.planets?.[p.name] : "AI 正在分析此星曜在宮位中的深層聯結..."}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="pt-4 border-t border-white/5">
                        <div className="py-3 text-[10px] text-slate-600 text-center border border-dashed border-white/10 rounded-xl">
                          此宮位目前無主要行星駐點，能量較為平穩
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Professional Report Selection (Pricing Section) */}
        <section className="space-y-10 pt-10">
          <div className="text-center space-y-3">
            <h3 className="text-3xl font-black tracking-tight">解鎖您的靈魂全書</h3>
            <p className="text-slate-400">選擇最適合您的深度解析方案，開啟更廣闊的命運視野</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* 1. Yearly Report */}
            <div className="glass-card p-6 flex flex-col h-full border-white/5 hover:border-purple-500/50 transition-all group relative">
              <div className="absolute -top-3 right-4 px-2 py-1 bg-amber-500 text-[9px] font-bold rounded-md text-white shadow-lg">HOT</div>
              {/* ... icon and text ... */}
              <div className="mb-6 w-12 h-12 bg-blue-500/20 rounded-2xl flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform">
                <Calendar className="w-6 h-6" />
              </div>
              <h5 className="text-xl font-bold mb-2">年度運勢專書</h5>
              <p className="text-xs text-slate-500 mb-6 flex-grow">掌握未來 12 個月的關鍵轉折點，包含每月詳盡預測與建議。</p>
              <ul className="space-y-2 mb-8 text-[11px] text-slate-400">
                <li className="flex items-center gap-2">✓ 12 個月月度運勢曲線</li>
                <li className="flex items-center gap-2">✓ 木土星重要流年相位</li>
                <li className="flex items-center gap-2">✓ 關鍵轉職與投資時機</li>
              </ul>
              <div className="mt-auto">
                <div className="text-2xl font-black mb-4">NT$ 299</div>
                <button
                  onClick={() => handleCheckout("yearly")}
                  className="w-full py-3 bg-white/5 border border-white/10 rounded-xl text-sm font-bold hover:bg-white/10 transition-all"
                >
                  立即購買
                </button>
              </div>
            </div>

            {/* 2. Love Report */}
            <div className="glass-card p-6 flex flex-col h-full border-white/5 hover:border-pink-500/50 transition-all group">
              <div className="mb-6 w-12 h-12 bg-pink-500/20 rounded-2xl flex items-center justify-center text-pink-400 group-hover:scale-110 transition-transform">
                <Sparkles className="w-6 h-6" />
              </div>
              <h5 className="text-xl font-bold mb-2">愛情報告</h5>
              <p className="text-xs text-slate-500 mb-6 flex-grow">深度解析您的愛情基因，預測未來桃花機緣與正緣特質。</p>
              <ul className="space-y-2 mb-8 text-[11px] text-slate-400">
                <li className="flex items-center gap-2">✓ 本命愛情觀與伴侶偏好</li>
                <li className="flex items-center gap-2">✓ 未來一年桃花期預測</li>
                <li className="flex items-center gap-2">✓ 避開爛桃花的精準建議</li>
              </ul>
              <div className="mt-auto">
                <div className="text-2xl font-black mb-4">NT$ 199</div>
                <button
                  onClick={() => handleCheckout("love")}
                  className="w-full py-3 bg-pink-500 text-white rounded-xl text-sm font-bold hover:opacity-90 transition-all"
                >
                  立即購買
                </button>
              </div>
            </div>

            {/* 3. Career Report */}
            <div className="glass-card p-6 flex flex-col h-full border-white/5 hover:border-emerald-500/50 transition-all group">
              <div className="mb-6 w-12 h-12 bg-emerald-500/20 rounded-2xl flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
                <Clock className="w-6 h-6" />
              </div>
              <h5 className="text-xl font-bold mb-2">事業財富地圖</h5>
              <p className="text-xs text-slate-500 mb-6 flex-grow">挖掘您的事業潛能，找出最適合的發財方位與職場生存策略。</p>
              <ul className="space-y-2 mb-8 text-[11px] text-slate-400">
                <li className="flex items-center gap-2">✓ 事業天賦與職涯定位</li>
                <li className="flex items-center gap-2">✓ 金錢能量與偏財運分析</li>
                <li className="flex items-center gap-2">✓ 創業/轉職風險評估</li>
              </ul>
              <div className="mt-auto">
                <div className="text-2xl font-black mb-4">NT$ 199</div>
                <button
                  onClick={() => handleCheckout("career")}
                  className="w-full py-3 bg-white/5 border border-white/10 rounded-xl text-sm font-bold hover:bg-white/10 transition-all"
                >
                  立即購買
                </button>
              </div>
            </div>

            {/* 4. Full Bundle */}
            <div className="p-6 flex flex-col h-full bg-gradient-to-br from-purple-600 to-indigo-700 rounded-3xl group relative shadow-2xl shadow-purple-500/20 scale-105 z-10">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-white text-purple-700 text-[10px] font-black rounded-full shadow-lg">最佳價值</div>
              <div className="mb-6 w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center text-white">
                <Sparkles className="w-6 h-6" />
              </div>
              <h5 className="text-xl font-bold mb-2 text-white">靈魂全書 (旗艦版)</h5>
              <p className="text-xs text-white/70 mb-6 flex-grow">
                您想知道的一切都在這裡。提供<span className="font-bold text-white underline decoration-purple-300">無限個問題提問</span>，我們將結合所有精準相位，一次在報告中完整解答。
              </p>
              <ul className="space-y-2 mb-8 text-[11px] text-white/80">
                <li className="flex items-center gap-2">✓ 包含所有專題報告內容</li>
                <li className="flex items-center gap-2">✓ 獨家：本命盤全相位解讀</li>
                <li className="flex items-center gap-2">✓ 獨家：無限提問，一次解答</li>
              </ul>
              <div className="mt-auto">
                <div className="flex items-baseline gap-2 mb-4">
                  <div className="text-3xl font-black text-white">NT$ 499</div>
                  <div className="text-xs text-white/50 line-through">NT$ 697</div>
                </div>
                <button
                  onClick={() => setShowQuestionModal(true)}
                  className="w-full py-4 bg-white text-purple-700 rounded-xl font-black text-sm hover:scale-105 transition-all shadow-xl"
                >
                  解鎖完整靈魂報告
                </button>
              </div>
            </div>
          </div>
        </section>
      </motion.div>

      {/* Soul Quest Modal */}
      <AnimatePresence>
        {showQuestionModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowQuestionModal(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-2xl bg-[#0a0a0f] border border-white/10 rounded-[2rem] md:rounded-[2.5rem] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
            >
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-purple-500 to-pink-500 z-20" />

              <button
                onClick={() => setShowQuestionModal(false)}
                className="absolute top-6 right-6 p-2 text-slate-500 hover:text-white transition-colors z-20"
              >
                <X className="w-6 h-6" />
              </button>

              <div className="p-6 md:p-12 space-y-8 overflow-y-auto custom-scrollbar flex-1">
                <div className="space-y-2 text-center">
                  <h3 className="text-3xl font-black flex items-center justify-center gap-3">
                    <Sparkles className="w-6 h-6 text-purple-400" />
                    靈魂提問箱
                  </h3>
                  <p className="text-slate-400">在開啟您的靈魂全書前，您想問星星什麼？</p>
                </div>

                {/* Quick Selection Tags */}
                <div className="space-y-4">
                  <div className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                    <MessageSquare className="w-3 h-3" />
                    快速加入常見問題 (可多選)
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {quickQuestions.map((q) => (
                      <button
                        key={q.id}
                        onClick={() => toggleTag(q.text)}
                        className={`px-4 py-2 rounded-full text-xs font-medium border transition-all ${activeTags.includes(q.text)
                            ? "bg-purple-600 border-purple-500 text-white shadow-lg shadow-purple-500/20"
                            : "bg-white/5 border-white/10 text-slate-400 hover:border-white/30"
                          }`}
                      >
                        {q.text}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom Question List */}
                <div className="space-y-4">
                  <div className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center justify-between">
                    <span>描述您具體的情境或煩惱...</span>
                    <span className="text-[10px] lowercase opacity-50">（輸入即會產生新的一行）</span>
                  </div>

                  <div className="max-h-[300px] overflow-y-auto pr-2 custom-scrollbar space-y-3">
                    {questions.map((q, idx) => (
                      <div key={idx} className="relative group">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-600 group-focus-within:text-purple-500 transition-colors">
                          {idx + 1}
                        </div>
                        <input
                          type="text"
                          value={q}
                          onChange={(e) => handleQuestionChange(idx, e.target.value)}
                          placeholder={idx === 0 ? "例如：我適合轉職嗎？" : "輸入您的下一個問題..."}
                          className="w-full bg-white/5 border border-white/10 rounded-xl py-4 pl-10 pr-4 text-sm text-slate-200 outline-none focus:border-purple-500/50 focus:bg-white/[0.08] transition-all"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-4">
                  <button
                    onClick={() => handleCheckout("bundle")}
                    className="w-full py-5 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl font-black text-lg hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-purple-500/30"
                  >
                    確認並解鎖靈魂報告
                  </button>
                  <p className="text-[10px] text-center text-slate-600 mt-4">
                    * 您的所有提問都將由 AI 深度分析，並整合在最終的萬字生命報告中。
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function getPlanetMeaning(name: string) {
  const meanings: Record<string, string> = {
    "太陽": "自我認同、生命力與基本性格",
    "月亮": "情感需求、潛意識與內在安全感",
    "水星": "思考邏輯、溝通表達與學習方式",
    "金星": "愛情觀、審美、價值觀與金錢",
    "火星": "行動力、慾望、競爭與生命能量",
    "木星": "擴張、幸運、信念與成長機會",
    "土星": "責任、壓力、考驗與生命功課",
    "天王星": "變革、獨立、創新與非傳統特質",
    "海王星": "直覺、夢想、靈性與同情心",
    "冥王星": "轉化、權力、深層變革與重生意志"
  };
  return meanings[name] || "生命能量";
}

function getHouseMeaning(houseStr: string) {
  const houseNum = parseInt(houseStr);
  const meanings: Record<number, string> = {
    1: "自我形象、外在人格與生命開端",
    2: "個人財富、價值觀與感官享受",
    3: "溝通學習、兄弟姊妹與短期旅行",
    4: "家庭根源、內在心理與晚年生活",
    5: "創造力、戀愛、子女與娛樂冒險",
    6: "日常工作、健康、責任與服務",
    7: "伴侶關係、合夥、契約與公開對手",
    8: "深層轉化、共有財產、秘密與生死",
    9: "高等教育、長途旅行、哲學與信念",
    10: "事業名聲、社會地位與公眾形象",
    11: "社交圈子、希望願景與群體互動",
    12: "潛意識、靈性隱修與因果業力"
  };
  return meanings[houseNum] || "生命領域";
}

function getHouseName(num: number) {
  const names = ["命宮", "財帛宮", "兄弟宮", "田宅宮", "子女宮", "奴僕宮", "夫妻宮", "疾厄宮", "遷移宮", "官祿宮", "福德宮", "相貌宮"];
  return names[num - 1];
}

function getZodiacSign(longitude: number) {
  const signs = ["牡羊座", "金牛座", "雙子座", "巨蟹座", "獅子座", "處女座", "天秤座", "天蠍座", "射手座", "摩羯座", "水瓶座", "雙魚座"];
  const normalizedLon = ((longitude % 360) + 360) % 360;
  return signs[Math.floor(normalizedLon / 30)];
}
