"use client";

import { useEffect, useState, use } from "react";
import { motion } from "framer-motion";
import { Sparkles, Printer, Download, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function PaidReportPage({ params }: { params: Promise<{ orderId: string }> }) {
  const resolvedParams = use(params);
  const orderId = resolvedParams.orderId;
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/report/${orderId}`)
      .then(res => res.json())
      .then(data => {
        setOrder(data);
        setLoading(false);
      });
  }, [orderId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050508] flex items-center justify-center">
        <div className="text-center space-y-4">
          <Sparkles className="w-12 h-12 text-purple-500 animate-spin mx-auto" />
          <p className="text-slate-400 animate-pulse">正在為您開啟靈魂全書...</p>
        </div>
      </div>
    );
  }

  if (order?.error) {
    return (
      <div className="min-h-screen bg-[#050508] flex items-center justify-center p-6">
        <div className="glass-card p-8 text-center space-y-6 max-w-md">
          <div className="text-red-400 text-5xl font-black">!</div>
          <h1 className="text-2xl font-bold">發生錯誤</h1>
          <p className="text-slate-400">{order.error}</p>
          <Link href="/chart">
            <button className="w-full py-4 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all mt-4">
              返回星盤頁面
            </button>
          </Link>
        </div>
      </div>
    );
  }

  const report = order.report_content;

  return (
    <main className="min-h-screen bg-[#050508] text-slate-200 py-12 px-6">
      <div className="max-w-3xl mx-auto space-y-12">
        
        {/* Navigation / Header */}
        <div className="flex justify-between items-center print:hidden">
          <Link href="/chart" className="flex items-center gap-2 text-slate-500 hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4" />
            返回星盤
          </Link>
          <div className="flex gap-4">
            <button 
              onClick={() => window.print()}
              className="p-3 bg-white/5 border border-white/10 rounded-full hover:bg-white/10 transition-all text-slate-400 hover:text-white"
              title="列印 / 儲存為 PDF"
            >
              <Printer className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Report Hero */}
        <header className="text-center space-y-6 pt-12">
          <div className="inline-block px-4 py-1.5 bg-purple-500/10 border border-purple-500/20 rounded-full text-xs font-black text-purple-400 tracking-widest uppercase">
            Official Soul Book
          </div>
          <h1 className="text-5xl font-black bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent leading-tight">
            {report.title}
          </h1>
          <div className="text-slate-500 text-sm">
            訂單編號：{order.order_id} · 生成日期：{new Date(report.generated_at).toLocaleDateString()}
          </div>
        </header>

        {/* Main Content Area */}
        <div className="glass-card p-10 md:p-16 space-y-12 border-white/5 shadow-2xl relative overflow-hidden">
          {/* Watermark for premium feel */}
          <div className="absolute inset-0 flex items-center justify-center opacity-[0.02] pointer-events-none select-none">
            <div className="text-[200px] font-black -rotate-45">AISTRO</div>
          </div>

          <div className="relative z-10 space-y-16">
            {/* Summary */}
            <section className="space-y-6">
              <div className="flex items-center gap-4">
                <h2 className="text-xl font-bold flex items-center gap-3">
                  <Sparkles className="w-5 h-5 text-purple-400" />
                  前言：靈魂的序曲
                </h2>
                <div className="h-px flex-1 bg-gradient-to-r from-white/10 to-transparent" />
              </div>
              <p className="text-slate-400 leading-relaxed text-lg italic">
                "{report.summary}"
              </p>
            </section>

            {/* Sections */}
            {report.sections.map((section: any, idx: number) => (
              <section key={idx} className="space-y-6">
                <div className="flex items-center gap-4">
                  <h2 className="text-xl font-bold">{section.title}</h2>
                  <div className="h-px flex-1 bg-gradient-to-r from-white/10 to-transparent" />
                </div>
                <div className="bg-white/5 border border-white/5 p-8 rounded-3xl text-slate-300 leading-relaxed space-y-4">
                  {section.content}
                </div>
              </section>
            ))}

            {/* Questions Answered */}
            <section className="space-y-6">
              <div className="flex items-center gap-4">
                <h2 className="text-xl font-bold text-pink-400">靈魂提問與星際回響</h2>
                <div className="h-px flex-1 bg-gradient-to-r from-pink-500/20 to-transparent" />
              </div>
              <div className="space-y-6">
                {order.questions?.map((q: string, i: number) => (
                  <div key={i} className="space-y-3">
                    <div className="text-sm font-bold text-slate-500">Q: {q}</div>
                    <div className="text-slate-400 bg-pink-500/5 border border-pink-500/10 p-6 rounded-2xl">
                      星星告訴我們...（此部分將由 AI 根據星盤生成詳細解答）
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>

        {/* Footer */}
        <footer className="text-center py-12 space-y-4 border-t border-white/5">
          <p className="text-slate-500 text-xs">
            © 2026 AISTROLOGY · 您的命運由您掌握
          </p>
          <div className="flex justify-center gap-6">
             <div className="w-2 h-2 rounded-full bg-purple-500/20" />
             <div className="w-2 h-2 rounded-full bg-pink-500/20" />
             <div className="w-2 h-2 rounded-full bg-blue-500/20" />
          </div>
        </footer>
      </div>

      <style jsx global>{`
        @media print {
          body { background: white !important; color: black !important; }
          .glass-card { background: white !important; border: 1px solid #eee !important; color: black !important; box-shadow: none !important; }
          .text-slate-400, .text-slate-500 { color: #666 !important; }
          .bg-white\/5 { background: #f9f9f9 !important; border: 1px solid #eee !important; }
          .bg-gradient-to-r { background: none !important; -webkit-background-clip: initial !important; color: black !important; }
        }
      `}</style>
    </main>
  );
}
