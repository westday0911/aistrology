
import { ArrowLeft, Eye } from "lucide-react";
import Link from "next/link";

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-[#050508] text-slate-300 py-20 px-6">
      <div className="max-w-3xl mx-auto space-y-12">
        <Link href="/" className="flex items-center gap-2 text-slate-500 hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4" /> 返回首頁
        </Link>

        <div className="space-y-4">
          <div className="w-12 h-12 bg-pink-500/10 rounded-xl flex items-center justify-center">
            <Eye className="w-6 h-6 text-pink-400" />
          </div>
          <h1 className="text-4xl font-black text-white">隱私權政策</h1>
          <p className="text-slate-500 italic">最後更新日期：2026年5月16日</p>
        </div>

        <div className="glass-card p-8 md:p-12 space-y-10 border-white/5 bg-white/5 leading-relaxed">
          <section className="space-y-4">
            <h2 className="text-xl font-bold text-white border-l-4 border-pink-500 pl-4">1. 資料蒐集項目</h2>
            <p>
              為了提供精確的占星服務，我們需要蒐集您的：姓名（或暱稱）、出生年月日、出生精確時間、出生地點（經緯度計算用）以及收件電子信箱。
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-white border-l-4 border-pink-500 pl-4">2. 資料使用目的</h2>
            <p>
              您的個人資訊僅用於以下用途：計算星盤、生成 AI 占星報告、將報告發送至您的信箱，以及發送與服務相關的重要通知。
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-white border-l-4 border-pink-500 pl-4">3. 資料安全與保存</h2>
            <p>
              我們採用業界標準的 SSL 加密技術保護您的資料傳輸。您的出生資料與報告內容將加密儲存於雲端伺服器，並設有嚴格的存取控制。
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-white border-l-4 border-pink-500 pl-4">4. 第三方服務</h2>
            <p>
              我們使用以下第三方服務來優化體驗：
              <ul className="list-disc ml-6 mt-2 space-y-2">
                <li><strong>PayUni</strong>：處理支付交易，本站不會接觸您的信用卡敏感資訊。</li>
                <li><strong>Google Analytics</strong>：收集匿名網站流量數據以優化介面。</li>
                <li><strong>Resend</strong>：用於發送電子郵件報告。</li>
              </ul>
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-white border-l-4 border-pink-500 pl-4">5. 您的權利</h2>
            <p>
              您可以隨時要求查詢、修正或刪除您的個人資料。若需相關服務，請透過電子郵件與我們聯繫。
            </p>
          </section>
        </div>

        <div className="text-center">
          <p className="text-slate-600 text-sm">
            由 Doris AI 學院 技術支援
          </p>
        </div>
      </div>
    </main>
  );
}
