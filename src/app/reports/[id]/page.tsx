import { Suspense } from "react";
import dbConnect from "@/lib/db";
import Chart from "@/models/Chart";
import { notFound } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Calendar, BookOpen, Star } from "lucide-react";

async function getReportData(id: string) {
  await dbConnect();
  const chart = await Chart.findById(id);
  if (!chart) return null;
  return JSON.parse(JSON.stringify(chart));
}

export default async function ReportPage({ params }: { params: { id: string } }) {
  const chart = await getReportData(params.id);

  if (!chart) {
    notFound();
  }

  // Determine which report to show (priority: full bundle > individual ones)
  const availableReports = Object.entries(chart.reports || {})
    .filter(([_, data]: [string, any]) => data.isPaid && data.content)
    .map(([type, _]) => type);

  return (
    <main className="min-h-screen bg-[#050508] text-slate-200 p-6 md:p-12 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full cosmic-gradient -z-10 opacity-50" />
      <div className="star-field" />

      <div className="max-w-4xl mx-auto space-y-12 relative">
        {/* Header Section */}
        <header className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500/10 border border-purple-500/20 rounded-full text-purple-300 text-sm font-medium">
            <Sparkles className="w-4 h-4" />
            <span>您的專屬靈魂全書</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-black tracking-tight text-white">
            {chart.input.name} 的靈魂藍圖
          </h1>
          <p className="text-slate-400">
            {chart.input.birthDate} {chart.input.birthTime} · {chart.input.location}
          </p>
        </header>

        {/* Reports Content */}
        {availableReports.length === 0 ? (
          <Card className="bg-slate-900/50 border-white/5 text-center p-12">
            <p className="text-slate-400">報告正在同步撰寫中，請稍後刷新頁面...</p>
          </Card>
        ) : (
          <div className="space-y-12">
            {availableReports.map((type) => {
              const report = chart.reports[type];
              return (
                <section key={type} className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
                  <div className="flex items-center gap-4 border-b border-white/10 pb-4">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/20">
                      <BookOpen className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-white uppercase tracking-wider">{type === 'full' ? '靈魂全書' : type} 報告</h2>
                      <p className="text-xs text-slate-500">生成於 {new Date(report.generatedAt).toLocaleDateString()}</p>
                    </div>
                  </div>

                  {/* Render dynamic content sections */}
                  <div className="grid gap-8">
                    {Object.entries(report.content).map(([section, text]: [string, any]) => (
                      <Card key={section} className="bg-slate-900/30 border-white/5 backdrop-blur-xl">
                        <CardHeader>
                          <CardTitle className="text-lg text-purple-300 flex items-center gap-2">
                            <Star className="w-4 h-4 fill-purple-400" />
                            {formatSectionName(section)}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="text-slate-300 leading-relaxed text-lg space-y-4">
                          {typeof text === 'string' ? (
                            <p>{text}</p>
                          ) : Array.isArray(text) ? (
                            <ul className="space-y-4">
                              {text.map((item, idx) => (
                                <li key={idx} className="flex gap-3">
                                  <span className="text-purple-500 font-bold">•</span>
                                  <span>{typeof item === 'string' ? item : JSON.stringify(item)}</span>
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <pre className="whitespace-pre-wrap font-sans">{JSON.stringify(text, null, 2)}</pre>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        )}

        {/* Footer Branding */}
        <footer className="pt-20 pb-10 text-center border-t border-white/5">
          <p className="text-slate-600 text-xs tracking-widest uppercase mb-4">&copy; 2026 Aistrology Premium Insights</p>
          <div className="h-1 w-12 bg-purple-500 mx-auto rounded-full" />
        </footer>
      </div>
    </main>
  );
}

function formatSectionName(name: string) {
  const mapping: Record<string, string> = {
    soulMission: "靈魂使命與天賦",
    fullChartAnalysis: "全盤星位深度解析",
    qAndA: "靈魂問答與啟示",
    conclusion: "結語：星辰的寄語",
    talents: "事業核心天賦",
    wealthEnergy: "財富格局與能量",
    careerTimeline: "職涯關鍵轉折點",
    recommendations: "行動建議",
    coreArchetype: "情感原型解析",
    relationshipNeeds: "親密關係需求",
    futureOutlook: "愛情未來展望",
    advice: "幸福導引",
    summary: "綜合分析摘要",
    monthlyForecast: "年度月度運勢趨勢",
    majorTransits: "重要流年相位提醒"
  };
  return mapping[name] || name;
}
