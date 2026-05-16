
import { ArrowLeft, Shield } from "lucide-react";
import Link from "next/link";

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-[#050508] text-slate-300 py-20 px-6">
      <div className="max-w-3xl mx-auto space-y-12">
        <Link href="/" className="flex items-center gap-2 text-slate-500 hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4" /> 返回首頁
        </Link>

        <div className="space-y-4">
          <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center">
            <Shield className="w-6 h-6 text-purple-400" />
          </div>
          <h1 className="text-4xl font-black text-white">服務條款</h1>
          <p className="text-slate-500 italic">最後更新日期：2026年5月16日</p>
        </div>

        <div className="glass-card p-8 md:p-12 space-y-10 border-white/5 bg-white/5 leading-relaxed">
          <section className="space-y-4">
            <h2 className="text-xl font-bold text-white border-l-4 border-purple-500 pl-4">1. 服務說明</h2>
            <p>
              Aistrology（下稱「本站」）利用先進的人工智慧技術結合天文數據，為使用者提供個人化星盤解析與占星報告。本服務旨在提供自我探索與心理輔助建議。
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-white border-l-4 border-purple-500 pl-4">2. AI 生成內容免責聲明</h2>
            <p>
              本服務所提供之所有報告內容均由 AI 自動生成。占星學並非精確科學，報告內容僅供參考。本站不保證內容的絕對準確性，亦不應將其視為醫療、法律、財務或專業心理診斷之依據。
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-white border-l-4 border-purple-500 pl-4">3. 使用者責任</h2>
            <p>
              使用者需確保所提供的出生日期、時間與地點之準確性。若因資料錯誤導致解析偏差，本站不承擔相關責任。
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-white border-l-4 border-purple-500 pl-4">4. 付款與退款政策</h2>
            <p>
              本服務屬於「非以有形媒介提供之數位內容」，依據相關法規，一旦購買成功並開始生成報告，即不適用消保法之七天鑑賞期，亦不接受退款要求。
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-white border-l-4 border-purple-500 pl-4">5. 智慧財產權</h2>
            <p>
              本站產出之報告內容版權歸 Aistrology 所有。使用者購買後獲得個人使用權，嚴禁未經授權之商業散佈或轉售。
            </p>
          </section>
        </div>

        <div className="text-center">
          <p className="text-slate-600 text-sm">
            若對以上條款有任何疑問，請聯繫：doris@hiinmusic.com
          </p>
        </div>
      </div>
    </main>
  );
}
