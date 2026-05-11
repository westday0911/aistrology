"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Calendar, Clock, MapPin, Sparkles } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

import { useRouter } from "next/navigation";

export default function BirthForm() {
  const router = useRouter();
  
  // Get current year for the default
  const currentYear = new Date().getFullYear();
  
  const [formData, setFormData] = useState({
    name: "",
    location: "",
  });

  // Separate states for the dropdowns
  const [dateParts, setDateParts] = useState({
    year: "1990",
    month: "1",
    day: "1",
    ampm: "AM",
    hour: "12",
    minute: "00",
  });

  // Helper arrays for dropdowns
  const years = Array.from({ length: 105 }, (_, i) => (currentYear - i).toString());
  const months = Array.from({ length: 12 }, (_, i) => (i + 1).toString());
  const days = Array.from({ length: 31 }, (_, i) => (i + 1).toString());
  const hours = Array.from({ length: 12 }, (_, i) => (i + 1).toString());
  const minutes = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, "0"));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Convert 12h format to 24h for API
    let h = parseInt(dateParts.hour);
    if (dateParts.ampm === "PM" && h < 12) h += 12;
    if (dateParts.ampm === "AM" && h === 12) h = 0;
    
    const formattedDate = `${dateParts.year}-${dateParts.month.padStart(2, "0")}-${dateParts.day.padStart(2, "0")}`;
    const formattedTime = `${h.toString().padStart(2, "0")}:${dateParts.minute}`;

    const submissionData = {
      ...formData,
      birthDate: formattedDate,
      birthTime: formattedTime,
    };
    
    try {
      const response = await fetch("/api/calculate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(submissionData),
      });
      
      const data = await response.json();
      if (data.success) {
        localStorage.setItem("astrologyData", JSON.stringify({
          input: submissionData,
          results: data.results,
          meta: data.meta
        }));
        router.push("/chart");
      } else {
        alert("計算失敗，請稍後再試");
      }
    } catch (error) {
      console.error(error);
      alert("連線錯誤");
    }
  };

  const selectClassName = "w-full bg-white/5 border border-white/10 rounded-xl py-3 px-2 outline-none focus:border-purple-500/50 transition-all appearance-none cursor-pointer text-sm text-center";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
      className="w-full max-w-md mx-auto"
    >
      <form
        onSubmit={handleSubmit}
        className="glass-card p-8 space-y-6 shadow-2xl shadow-purple-500/10"
      >
        <div className="space-y-2 text-center mb-8">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            開啟你的星際密碼
          </h2>
          <p className="text-slate-400 text-sm">輸入出生資訊，即刻生成個人專屬星盤</p>
        </div>

        <div className="space-y-5">
          {/* Name Input */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-2">
              <Sparkles className="w-3 h-3" /> 姓名 / 暱稱
            </label>
            <input
              type="text"
              placeholder="如何稱呼您？"
              className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 outline-none focus:border-purple-500/50 transition-all"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          {/* Date Selectors */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-2">
              <Calendar className="w-3 h-3" /> 出生日期
            </label>
            <div className="grid grid-cols-3 gap-2">
              <select 
                className={selectClassName}
                value={dateParts.year}
                onChange={(e) => setDateParts({...dateParts, year: e.target.value})}
              >
                {years.map(y => <option key={y} value={y} className="bg-slate-900">{y} 年</option>)}
              </select>
              <select 
                className={selectClassName}
                value={dateParts.month}
                onChange={(e) => setDateParts({...dateParts, month: e.target.value})}
              >
                {months.map(m => <option key={m} value={m} className="bg-slate-900">{m} 月</option>)}
              </select>
              <select 
                className={selectClassName}
                value={dateParts.day}
                onChange={(e) => setDateParts({...dateParts, day: e.target.value})}
              >
                {days.map(d => <option key={d} value={d} className="bg-slate-900">{d} 日</option>)}
              </select>
            </div>
          </div>

          {/* Time Selectors */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-2">
              <Clock className="w-3 h-3" /> 出生時間
            </label>
            <div className="grid grid-cols-3 gap-2">
              <select 
                className={selectClassName}
                value={dateParts.ampm}
                onChange={(e) => setDateParts({...dateParts, ampm: e.target.value})}
              >
                <option value="AM" className="bg-slate-900">上午 AM</option>
                <option value="PM" className="bg-slate-900">下午 PM</option>
              </select>
              <select 
                className={selectClassName}
                value={dateParts.hour}
                onChange={(e) => setDateParts({...dateParts, hour: e.target.value})}
              >
                {hours.map(h => <option key={h} value={h} className="bg-slate-900">{h} 點</option>)}
              </select>
              <select 
                className={selectClassName}
                value={dateParts.minute}
                onChange={(e) => setDateParts({...dateParts, minute: e.target.value})}
              >
                {minutes.map(m => <option key={m} value={m} className="bg-slate-900">{m} 分</option>)}
              </select>
            </div>
          </div>

          {/* Location Input */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-2">
              <MapPin className="w-3 h-3" /> 出生地點
            </label>
            <input
              type="text"
              placeholder="例如：台北市, 台灣"
              className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 outline-none focus:border-purple-500/50 transition-all"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              required
            />
          </div>
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          type="submit"
          className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-purple-500/20 transition-all mt-4 flex items-center justify-center gap-2"
        >
          <Sparkles className="w-5 h-5" />
          生成我的專屬星盤
        </motion.button>

        <p className="text-[10px] text-center text-slate-500 px-4">
          * 準確的出生時間與地點是計算精確星盤的關鍵。如果您不確定時間，可選擇中午 12 點，但宮位與上升星座可能會有誤差。
        </p>
      </form>
    </motion.div>
  );
}
