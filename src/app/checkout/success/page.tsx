"use client";

import { useEffect, Suspense } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, ArrowRight, Sparkles, Mail } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import * as gtag from "@/lib/gtag";

function SuccessContent() {
  const searchParams = useSearchParams();
  const orderNo = searchParams.get("orderNo");

  useEffect(() => {
    if (orderNo) {
      // GA Tracking for purchase
      gtag.event({
        action: "purchase",
        params: {
          transaction_id: orderNo,
          currency: "TWD",
          items: [
            {
              item_id: "astrology_report",
              item_name: "AI Astrology Report",
              item_category: "Digital Product"
            }
          ]
        }
      });
    }
  }, [orderNo]);

  return (
    <main className="min-h-screen bg-[#050508] text-slate-200 flex items-center justify-center p-6">
      <div className="max-w-md w-full space-y-8 text-center">
        {/* Success Icon */}
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", damping: 12, stiffness: 100 }}
          className="w-24 h-24 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto"
        >
          <CheckCircle2 className="w-12 h-12 text-emerald-500" />
        </motion.div>

        {/* Text Content */}
        <div className="space-y-4">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl font-black"
          >
            付款成功！
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-slate-400"
          >
            您的靈魂全書已編撰完成，星辰的啟示正等待著您。
          </motion.p>
        </div>

        {/* Order Info Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card p-6 bg-white/5 border border-white/10 rounded-3xl space-y-4"
        >
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">訂單編號</span>
            <span className="font-mono text-purple-400">{orderNo || "處理中..."}</span>
          </div>
          <div className="h-px bg-white/5" />
          <div className="flex items-center gap-3 text-left">
            <div className="w-10 h-10 bg-purple-500/20 rounded-xl flex items-center justify-center">
              <Mail className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <div className="text-xs font-bold">報告已同步寄出</div>
              <div className="text-[10px] text-slate-500">請檢查您的電子信箱（包含垃圾郵件箱）</div>
            </div>
          </div>
        </motion.div>

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="space-y-4 pt-4"
        >
          <Link href={`/report/${orderNo || "demo"}`} className="block">
            <button className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl font-black text-lg hover:opacity-90 transition-all shadow-xl shadow-purple-500/20 flex items-center justify-center gap-2">
              查看我的靈魂報告
              <ArrowRight className="w-5 h-5" />
            </button>
          </Link>
          <Link href="/chart" className="block">
            <button className="w-full py-4 bg-white/5 border border-white/10 rounded-2xl font-bold text-slate-400 hover:text-white transition-all">
              回到我的星盤
            </button>
          </Link>
        </motion.div>

        {/* Sparkles Decoration */}
        <div className="flex justify-center gap-2 pt-8">
          <Sparkles className="w-4 h-4 text-purple-500/40" />
          <Sparkles className="w-4 h-4 text-pink-500/40" />
          <Sparkles className="w-4 h-4 text-purple-500/40" />
        </div>
      </div>
    </main>
  );
}

export default function SuccessPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#050508] flex items-center justify-center text-slate-400">載入中...</div>}>
      <SuccessContent />
    </Suspense>
  );
}
