import ChartDisplay from "@/components/ChartDisplay";
import { Sparkles } from "lucide-react";

export default function ChartPage() {
  return (
    <main className="min-h-screen relative flex flex-col items-center p-6 md:p-12 overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="star-field" />
      <div className="absolute top-0 left-0 w-full h-full cosmic-gradient -z-10" />
      
      {/* Header */}
      <div className="w-full max-w-5xl mb-12 flex items-center gap-4">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/20">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        <h1 className="text-xl font-black tracking-tighter">
          AI<span className="text-purple-500">STROLOGY</span>
        </h1>
      </div>

      <ChartDisplay />

      {/* Footer */}
      <footer className="mt-20 flex flex-col items-center gap-2">
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
    </main>
  );
}
