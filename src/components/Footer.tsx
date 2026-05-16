
import Link from "next/link";

export default function Footer({ className = "" }: { className?: string }) {
  return (
    <footer className={`flex flex-col items-center gap-4 ${className}`}>
      <div className="flex gap-6 text-[10px] text-slate-500 uppercase tracking-widest font-bold">
        <Link href="/terms" className="hover:text-purple-400 transition-colors">服務條款</Link>
        <Link href="/privacy" className="hover:text-purple-400 transition-colors">隱私權政策</Link>
      </div>
      
      <div className="flex flex-col items-center gap-2">
        <div className="text-slate-600 text-[10px] uppercase tracking-[0.2em]">
          &copy; 2026 AISTROLOGY &bull; Precision Ephemeris &bull; AI Insight
        </div>
        <a 
          href="https://www.doris-school.com" 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-xs font-medium text-slate-400 hover:text-purple-400 transition-colors flex items-center gap-1.5"
        >
          由 <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent font-bold">Doris AI 學院</span> 開發
        </a>
      </div>
    </footer>
  );
}
