"use client";

import { useState, useEffect, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CreditCard, ShieldCheck, ArrowLeft, Mail, ChevronRight, Sparkles } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const type = searchParams.get("type") || "bundle";
  
  const [email, setEmail] = useState("");
  const [name, setName] = useState(""); // Add name state
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedAddons, setSelectedAddons] = useState<string[]>([]);
  const [orderInfo, setOrderInfo] = useState<any>(null);

  useEffect(() => {
    const saved = localStorage.getItem("pendingOrder");
    if (saved) setOrderInfo(JSON.parse(saved));
  }, []);

  const allProducts: Record<string, { name: string; price: number; desc: string }> = {
    yearly: { name: "年度運勢專書", price: 299, desc: "掌握未來 12 個月關鍵轉折" },
    love: { name: "愛情報告", price: 199, desc: "深度解析愛情基因與桃花" },
    career: { name: "事業財富地圖", price: 199, desc: "挖掘事業潛能與發財方位" },
    bundle: { name: "靈魂全書 (旗艦版)", price: 499, desc: "包含所有專題 + 無限提問解答" },
  };

  const primaryProduct = allProducts[type] || allProducts.bundle;
  
  // Available addons are products NOT the primary one
  const availableAddons = Object.entries(allProducts).filter(([key]) => key !== type && key !== "bundle");

  const [couponCode, setCouponCode] = useState("");
  const [discountAmount, setDiscountAmount] = useState(0);
  const [appliedCoupon, setAppliedCoupon] = useState("");
  const [couponError, setCouponError] = useState("");
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);

  const handleApplyCoupon = async () => {
    if (!couponCode) return;
    setIsValidatingCoupon(true);
    setCouponError("");
    
    try {
      const res = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: couponCode })
      });
      const data = await res.json();
      if (data.success) {
        setDiscountAmount(data.discount_amount);
        setAppliedCoupon(data.code);
        setCouponError("");
      } else {
        setCouponError(data.error);
        setDiscountAmount(0);
        setAppliedCoupon("");
      }
    } catch (err) {
      setCouponError("系統錯誤");
    } finally {
      setIsValidatingCoupon(false);
    }
  };

  const totalAmount = Math.max(0, primaryProduct.price + selectedAddons.reduce((sum, key) => sum + allProducts[key].price, 0) - discountAmount);
  const orderDescription = [primaryProduct.name, ...selectedAddons.map(key => allProducts[key].name)].join(" + ");

  const [payData, setPayData] = useState<any>(null);

  // Use useEffect to ensure DOM is updated before submitting
  useEffect(() => {
    if (payData && payData.EncryptInfo) {
      const form = document.getElementById("payuni-form") as HTMLFormElement;
      if (form) {
        console.log("Submitting to PayUni...", payData);
        form.submit();
      }
    }
  }, [payData]);

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return alert("請輸入電子信箱");
    if (!name) return alert("請輸入姓名");
    
    setIsProcessing(true);
    
    const fullType = [type, ...selectedAddons].join(",");
    
    try {
      const response = await fetch("/api/payuni/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: fullType,
          email,
          customer_name: name, // Send name
          amount: totalAmount,
          name: orderDescription,
          birthData: orderInfo?.birthData,
          chartData: orderInfo?.chartData,
          questions: orderInfo?.questions,
          couponCode: appliedCoupon // Pass applied coupon to backend
        }),
      });
      
      const data = await response.json();
      if (data.success) {
        setPayData(data.payload);
      } else {
        alert("金流初始化失敗: " + data.error);
        setIsProcessing(false);
      }
    } catch (error) {
      console.error(error);
      alert("連線錯誤");
      setIsProcessing(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#050508] text-slate-200 py-12 px-6">
      {/* Hidden PayUni Form - Always present to ensure stability */}
      <form id="payuni-form" method="POST" action={payData?.ApiUrl || ""}>
        <input type="hidden" name="MerID" value={payData?.MerID || ""} />
        <input type="hidden" name="EncryptInfo" value={payData?.EncryptInfo || ""} />
        <input type="hidden" name="HashInfo" value={payData?.HashInfo || ""} />
        <input type="hidden" name="Version" value={payData?.Version || "2.0"} />
      </form>

      <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12">
        
        {/* Left: Order Summary */}
        <div className="space-y-8">
          <Link href="/chart" className="flex items-center gap-2 text-slate-500 hover:text-white transition-colors mb-4">
            <ArrowLeft className="w-4 h-4" />
            返回修改
          </Link>

          <div className="space-y-4">
            <h1 className="text-3xl font-black">結帳確認</h1>
            <p className="text-slate-400">請確認您的訂單內容並完成付款</p>
          </div>

          {/* Order Summary Card */}
          <div className="glass-card p-6 space-y-4 border-white/10">
            <div className="flex justify-between items-center">
              <span className="text-slate-400">{primaryProduct.name}</span>
              <span className="font-bold">NT$ {primaryProduct.price}</span>
            </div>
            
            {selectedAddons.map(key => (
              <div key={key} className="flex justify-between items-center text-sm">
                <span className="text-slate-400">+ {allProducts[key].name}</span>
                <span className="font-medium">NT$ {allProducts[key].price}</span>
              </div>
            ))}

            <div className="h-px bg-white/5 my-4" />
            
            {/* Coupon Section */}
            <div className="space-y-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="輸入優惠碼"
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm outline-none focus:border-purple-500/50 transition-all"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                />
                <button
                  type="button"
                  onClick={handleApplyCoupon}
                  disabled={isValidatingCoupon || !couponCode}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 rounded-xl text-xs font-bold transition-all"
                >
                  {isValidatingCoupon ? "驗證中..." : "套用"}
                </button>
              </div>
              {couponError && <p className="text-[10px] text-red-400 ml-1">{couponError}</p>}
              {appliedCoupon && <p className="text-[10px] text-emerald-400 ml-1">已套用優惠碼: {appliedCoupon}</p>}
            </div>

            <div className="h-px bg-white/5 mt-4" />
            
            {discountAmount > 0 && (
              <div className="flex justify-between items-center text-sm text-emerald-400 py-2">
                <span>優惠折抵</span>
                <span>- NT$ {discountAmount}</span>
              </div>
            )}

            <div className="flex justify-between items-center text-lg font-black pt-2">
              <span>總計</span>
              <span className="text-purple-400">NT$ {totalAmount}</span>
            </div>
          </div>

          {/* Upsell Section */}
          {availableAddons.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-400" />
                加購推薦 (限時優惠)
              </h3>
              <div className="space-y-3">
                {availableAddons.map(([key, item]) => (
                  <label 
                    key={key} 
                    className={`flex items-center justify-between p-4 rounded-2xl border transition-all cursor-pointer ${
                      selectedAddons.includes(key) 
                        ? "bg-purple-500/10 border-purple-500/40" 
                        : "bg-white/5 border-white/10 hover:border-white/20"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input 
                        type="checkbox" 
                        className="w-4 h-4 rounded border-white/20 bg-white/5 text-purple-500 focus:ring-purple-500"
                        checked={selectedAddons.includes(key)}
                        onChange={() => {
                          setSelectedAddons(prev => 
                            prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
                          );
                        }}
                      />
                      <div>
                        <div className="text-sm font-bold">{item.name}</div>
                        <div className="text-[10px] text-slate-500">{item.desc}</div>
                      </div>
                    </div>
                    <div className="text-sm font-black text-purple-300">
                      NT$ {item.price}
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}

          <div className="p-4 bg-blue-500/5 border border-blue-500/20 rounded-xl flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
            <p className="text-[11px] text-slate-400 leading-relaxed">
              您的交易已透過 SSL 加密保護。我們採用統一金流 (PayUni) 安全支付系統，不會儲存您的完整信用卡資訊。
            </p>
          </div>
        </div>

        {/* Right: Payment Form */}
        <div className="glass-card p-8 md:p-10 shadow-2xl border-purple-500/10">
          <form onSubmit={handlePay} className="space-y-6">
            <div className="space-y-6">
              <div className="space-y-4">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">星盤主人姓名</label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="例如：王小明"
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-4 px-12 text-sm outline-none focus:border-purple-500 transition-all"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                  <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">收件電子信箱</label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    placeholder="report@example.com"
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-4 px-12 text-sm outline-none focus:border-purple-500 transition-all"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                </div>
                <p className="text-[10px] text-slate-500 ml-1">* 付費成功後，完整報告將同步發送至此信箱</p>
              </div>
            </div>

            <div className="space-y-6">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">付款方式</label>
              <div className="p-6 bg-white/5 border border-white/10 rounded-2xl space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                      <CreditCard className="w-5 h-5 text-purple-400" />
                    </div>
                    <div>
                      <div className="text-sm font-bold">線上刷卡 / 行動支付</div>
                      <div className="text-[10px] text-slate-500">透過 統一金流 (PayUni) 安全支付</div>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <div className="w-6 h-4 bg-white/10 rounded" />
                    <div className="w-6 h-4 bg-white/10 rounded" />
                    <div className="w-6 h-4 bg-white/10 rounded" />
                  </div>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed bg-white/5 p-3 rounded-lg">
                  點擊下方按鈕後，系統將帶領您前往 **統一金流官方安全支付頁面** 完成付款。付款成功後將自動導回本站。
                </p>
              </div>
            </div>

            <button
              disabled={isProcessing}
              type="submit"
              className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl font-black text-lg hover:opacity-90 transition-all shadow-xl shadow-purple-500/20 flex items-center justify-center gap-2"
            >
              {isProcessing ? (
                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  確認付款 NT$ {totalAmount}
                  <ChevronRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#050508] flex items-center justify-center">載入中...</div>}>
      <CheckoutContent />
    </Suspense>
  );
}
