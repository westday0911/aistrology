"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, ArrowLeft, Calendar, Clock, X, MessageSquare, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

export default function ChartDisplay() {
  const [data, setData] = useState<any>(null);
  const [mounted, setMounted] = useState(false);
  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const [questions, setQuestions] = useState<string[]>([""]);
  const [activeTags, setActiveTags] = useState<string[]>([]);
  const [aiAnalysis, setAiAnalysis] = useState<any>(null);
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const isFetching = useRef(false);

  const handleQuestionChange = (index: number, value: string) => {
    const newQuestions = [...questions];
    newQuestions[index] = value;
    if (index === newQuestions.length - 1 && value.trim() !== "") {
      newQuestions.push("");
    }
    setQuestions(newQuestions);
  };

  useEffect(() => {
    setMounted(true);
    const savedData = localStorage.getItem("astrologyData");
    if (savedData) {
      const parsed = JSON.parse(savedData);
      setData(parsed);
      
      const cacheKey = `summary_${parsed.input.birthDate}_${parsed.input.birthTime}_${parsed.input.location}`;
      const cachedSummary = localStorage.getItem(cacheKey);

      if (cachedSummary) {
        setAiAnalysis(JSON.parse(cachedSummary));
      } else if (!isFetching.current && !aiAnalysis) {
        isFetching.current = true;
        setIsAiGenerating(true);
        
        fetch("/api/ai/free-summary", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            chartData: parsed.results,
            inputData: parsed.input
          })
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
    "太陽": "☀️", "月亮": "🌙", "水星": "☿", "金星": "♀", "火星": "♂",
    "木星": "♃", "土星": "♄", "天王星": "♅", "海王星": "♆", "冥王星": "♇",
    "上升星座": "ASC", "天頂": "MC"
  };

  const zodiacSymbols = ["牡羊", "金牛", "雙子", "巨蟹", "獅子", "處女", "天秤", "天蠍", "射手", "摩羯", "水瓶", "雙魚"];
  const planets = data?.results || [];
  const meta = data?.meta || {};
  const houses = meta.houses || [];
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
    { id: 'career_1', text: "我適合轉職嗎？" },
    { id: 'love_1', text: "我的正緣何時出現？" },
    { id: 'wealth_1', text: "今年財運如何？" },
    { id: 'self_1', text: "我的靈魂使命是什麼？" },
  ];

  const toggleTag = (text: string) => {
    setActiveTags(prev => prev.includes(text) ? prev.filter(t => t !== text) : [...prev, text]);
  };

  const router = useRouter();
  const handleCheckout = (type: string) => {
    const allQuestions = [...activeTags, ...questions.filter(q => q.trim() !== "")];
    const pendingOrder = { birthData: input, chartData: { planets, houses }, questions: allQuestions };
    localStorage.setItem("pendingOrder", JSON.stringify(pendingOrder));
    router.push(`/checkout?type=${type}`);
  };

  if (!mounted) return <div className="min-h-screen bg-[#050508]" />;

  return (
    <div className="w-full max-w-5xl mx-auto space-y-8 pb-32">
      <div className="flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4" />
          <span>重新輸入</span>
        </Link>
        <div className="text-right">
          <h2 className="text-2xl font-bold">您的專屬靈魂藍圖</h2>
          <p className="text-slate-500 text-sm">{input.birthDate} {input.birthTime} · {input.location}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 glass-card aspect-square flex items-center justify-center relative overflow-hidden group">
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

            {/* House Cusps & Labels */}
            {houses.map((cusp: number, i: number) => {
              const p1 = getPos(cusp, 40);
              const p2 = getPos(cusp, 150);
              const labelPos = getPos(cusp + 15, 70); 
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
                  <circle
                    cx={p.x} cy={p.y} r="12"
                    className="fill-purple-600/20 stroke-purple-500/50 group-hover/planet:fill-purple-500/40 transition-all"
                  />
                  <text
                    x={p.x} y={p.y}
                    textAnchor="middle"
                    dy=".3em"
                    className="fill-white text-[12px] pointer-events-none"
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
        </div>

        <div className="space-y-6 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
          <div className="grid grid-cols-2 gap-3">
            {planets.filter((p: any) => p.name === "上升星座" || p.name === "天頂").map((point: any) => (
              <Card key={point.name} className="bg-purple-500/5 border-purple-500/20">
                <CardContent className="p-4 text-center">
                  <div className="text-[10px] text-purple-400 uppercase font-bold mb-1">{point.name}</div>
                  <div className="text-lg font-bold">{point.sign}</div>
                  <div className="text-[10px] text-slate-500">{point.degree}</div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="space-y-2">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">行星落位</h3>
            {planets.filter((p: any) => p.name !== "上升星座" && p.name !== "天頂").map((planet: any, i: number) => (
              <Card key={planet.name} className="border-white/5 bg-white/5">
                <CardContent className="flex items-center justify-between p-3">
                  <div className="flex items-center gap-3">
                    <span className="text-xl w-8 text-center">{planetIcons[planet.name]}</span>
                    <div>
                      <div className="text-sm font-bold">{planet.name}</div>
                      <Badge variant="secondary" className="text-[9px] h-4 px-1.5">{planet.house}</Badge>
                    </div>
                  </div>
                  <div className="text-right text-xs">
                    <div className="text-slate-300 font-medium">{planet.sign}</div>
                    <div className="text-slate-500">{planet.degree}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-12 pt-12 border-t border-white/10">
        <div className="text-center space-y-6 max-w-3xl mx-auto">
          <h3 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">靈魂藍圖：生命密碼初探</h3>
          <Card className="bg-purple-500/5 border-purple-500/20 relative">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-purple-600 rounded-full text-[10px] font-bold text-white z-10 shadow-lg">AI ANALYSIS</div>
            <CardContent className="p-8 pt-10">
              {isAiGenerating ? (
                <div className="space-y-4">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-5/6 mx-auto" />
                  <Skeleton className="h-4 w-4/6 mx-auto" />
                  <p className="text-purple-300/50 text-[10px] font-bold text-center animate-pulse tracking-[0.2em] pt-4">正在對接星際訊號...</p>
                </div>
              ) : aiAnalysis ? (
                <p className="text-slate-300 leading-relaxed text-lg italic text-center">"{aiAnalysis.summary}"</p>
              ) : (
                <div className="text-center py-4">
                  <Skeleton className="h-4 w-20 mx-auto" />
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {planets.filter((p: any) => ["太陽", "月亮", "水星", "金星", "火星"].includes(p.name)).map((planet: any) => (
            <Card key={planet.name} className="border-l-4 border-l-purple-500 bg-slate-900/40">
              <CardHeader className="flex flex-row items-center gap-4">
                <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center text-2xl border border-white/5">{planetIcons[planet.name]}</div>
                <div>
                  <CardTitle className="text-lg">{planet.name} {getZodiacSign(planet.longitude)}</CardTitle>
                  <Badge variant="outline" className="mt-1">{planet.house}</Badge>
                </div>
              </CardHeader>
              <CardContent className="text-sm text-slate-400 leading-relaxed">
                {aiAnalysis ? (
                  <p>{aiAnalysis.planets?.[planet.name]}</p>
                ) : (
                  <div className="space-y-2">
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-3 w-5/6" />
                    <Skeleton className="h-3 w-4/6" />
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(12)].map((_, i) => {
            const houseNum = i + 1;
            const planetsInHouse = planets.filter((p: any) => parseInt(p.house) === houseNum);
            return (
              <Card key={houseNum} className="bg-slate-900/20 border-white/5 group hover:border-purple-500/30 transition-all">
                <CardContent className="p-6 space-y-4">
                  <div className="flex justify-between items-end border-b border-white/5 pb-2">
                    <div>
                      <Badge className="mb-1">第 {houseNum} 宮</Badge>
                      <h5 className="text-lg font-bold text-slate-200">{getHouseName(houseNum)}</h5>
                    </div>
                    <span className="text-xs text-purple-300 font-medium">{getZodiacSign(houses[i])}</span>
                  </div>
                  <div className="text-sm text-slate-400">
                    {aiAnalysis ? (
                      <p>{aiAnalysis.houses?.[houseNum]}</p>
                    ) : (
                      <div className="space-y-2">
                        <Skeleton className="h-3 w-full" />
                        <Skeleton className="h-3 w-full" />
                        <Skeleton className="h-3 w-2/3" />
                      </div>
                    )}
                  </div>
                  {planetsInHouse.length > 0 && (
                    <div className="pt-4 border-t border-white/5 space-y-2">
                      <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1">宮內行星影響</p>
                      {planetsInHouse.map((p: any) => (
                        <div key={p.name} className="flex items-center gap-2">
                          <span className="text-xs">{planetIcons[p.name]}</span>
                          <span className="text-[10px] text-slate-400">
                            {p.name}：落在 {getZodiacSign(p.longitude)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        <section className="pt-20 space-y-12">
          <div className="text-center space-y-4">
            <h3 className="text-4xl font-black">解鎖您的靈魂全書</h3>
            <p className="text-slate-400">選擇深度解析方案，開啟更廣闊的命運視野</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { id: "yearly", name: "年度運勢專書", price: "299", desc: "掌握未來 12 個月轉折點", icon: <Calendar />, color: "blue" },
              { id: "love", name: "愛情報告", price: "199", desc: "深度解析愛情基因", icon: <Sparkles />, color: "pink" },
              { id: "career", name: "事業財富地圖", price: "199", desc: "挖掘事業潛能", icon: <Clock />, color: "emerald" }
            ].map(plan => (
              <Card key={plan.id} className="flex flex-col border-white/5 hover:border-purple-500/50 transition-all">
                <CardHeader>
                  <div className={`w-12 h-12 bg-${plan.color}-500/10 text-${plan.color}-400 rounded-xl flex items-center justify-center mb-4`}>{plan.icon}</div>
                  <CardTitle>{plan.name}</CardTitle>
                  <CardDescription>{plan.desc}</CardDescription>
                </CardHeader>
                <CardFooter className="mt-auto flex flex-col gap-4 items-start">
                  <div className="text-2xl font-black">NT$ {plan.price}</div>
                  <Button variant="outline" className="w-full" onClick={() => handleCheckout(plan.id)}>立即購買</Button>
                </CardFooter>
              </Card>
            ))}
            <Card className="bg-gradient-to-br from-purple-600 to-indigo-700 border-none shadow-2xl shadow-purple-500/40 scale-105 z-10">
              <CardHeader>
                <Badge className="bg-white text-purple-700 w-fit mb-2">最佳價值</Badge>
                <CardTitle className="text-white">靈魂全書 (旗艦版)</CardTitle>
                <CardDescription className="text-white/70">包含所有專題，提供無限提問解答。</CardDescription>
              </CardHeader>
              <CardFooter className="mt-auto flex flex-col gap-4 items-start">
                <div className="text-3xl font-black text-white">NT$ 499</div>
                <Button className="w-full bg-white text-purple-700 hover:bg-slate-100" onClick={() => setShowQuestionModal(true)}>解鎖完整報告</Button>
              </CardFooter>
            </Card>
          </div>
        </section>
      </motion.div>

      <AnimatePresence>
        {showQuestionModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md">
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="relative w-full max-w-2xl bg-slate-900 border border-white/10 rounded-[2.5rem] p-8 md:p-12 overflow-hidden max-h-[90vh] flex flex-col">
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-purple-500 to-pink-500" />
              <Button variant="ghost" size="icon" className="absolute top-6 right-6" onClick={() => setShowQuestionModal(false)}><X /></Button>
              <div className="overflow-y-auto pr-2 space-y-8 custom-scrollbar">
                <div className="text-center space-y-2">
                  <h3 className="text-3xl font-black flex items-center justify-center gap-3"><Sparkles className="text-purple-400" />靈魂提問箱</h3>
                  <p className="text-slate-400">在開啟您的靈魂全書前，您想問星星什麼？</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {quickQuestions.map(q => (
                    <Button key={q.id} variant={activeTags.includes(q.text) ? "default" : "outline"} size="sm" onClick={() => toggleTag(q.text)} className="rounded-full">{q.text}</Button>
                  ))}
                </div>
                <div className="space-y-4">
                  {questions.map((q, i) => (
                    <input key={i} type="text" value={q} onChange={(e) => handleQuestionChange(i, e.target.value)} placeholder="描述您的煩惱..." className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-4 text-slate-200 focus:border-purple-500/50 outline-none" />
                  ))}
                </div>
              </div>
              <Button className="w-full py-8 mt-8 text-xl font-black" onClick={() => handleCheckout("bundle")}>確認提問並解鎖全書 <ChevronRight className="ml-2" /></Button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* AI Analysis Loading Modal */}
      <Dialog open={isAiGenerating}>
        <DialogContent className="max-w-xs sm:max-w-md border-none bg-transparent shadow-none outline-none">
          <div className="flex flex-col items-center justify-center space-y-8 py-10">
            {/* Pulsing Cosmic Orb */}
            <div className="relative">
              <motion.div
                animate={{ 
                  scale: [1, 1.2, 1],
                  opacity: [0.3, 0.6, 0.3]
                }}
                transition={{ duration: 3, repeat: Infinity }}
                className="absolute inset-0 bg-purple-500 rounded-full blur-3xl"
              />
              <div className="relative w-24 h-24 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full flex items-center justify-center shadow-[0_0_50px_rgba(168,85,247,0.4)] border border-white/20">
                <Sparkles className="w-10 h-10 text-white animate-pulse" />
              </div>
            </div>

            <div className="text-center space-y-3">
              <h3 className="text-xl font-bold text-white tracking-tight">星際數據對接中</h3>
              <p className="text-purple-300/70 text-sm animate-pulse tracking-widest">
                正在分析您的行星相位與宮位能量...
              </p>
            </div>

            <div className="flex gap-2">
              <div className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
              <div className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
              <div className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-bounce" />
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function getZodiacSign(longitude: number) {
  const signs = ["牡羊座", "金牛座", "雙子座", "巨蟹座", "獅子座", "處女座", "天秤座", "天蠍座", "射手座", "摩羯座", "水瓶座", "雙魚座"];
  return signs[Math.floor((((longitude % 360) + 360) % 360) / 30)];
}

function getHouseName(num: number) {
  const names = ["命宮", "財帛宮", "兄弟宮", "田宅宮", "子女宮", "奴僕宮", "夫妻宮", "疾厄宮", "遷移宮", "官祿宮", "福德宮", "相貌宮"];
  return names[num - 1] || `第 ${num} 宮`;
}
