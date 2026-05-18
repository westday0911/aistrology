"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Calendar, Clock, MapPin, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import * as gtag from "@/lib/gtag";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function BirthForm() {
  const router = useRouter();
  const currentYear = new Date().getFullYear();

  const [formData, setFormData] = useState({
    name: "",
    location: "",
  });

  const [dateParts, setDateParts] = useState({
    year: "1990",
    month: "1",
    day: "1",
    ampm: "AM",
    hour: "12",
    minute: "00",
  });

  const [hasTrackedStart, setHasTrackedStart] = useState(false);

  const handleFormInteraction = () => {
    if (!hasTrackedStart) {
      setHasTrackedStart(true);
      gtag.event({
        action: "form_start",
        category: "engagement",
        label: "birth_form_first_interaction"
      });
    }
  };

  const years = Array.from({ length: 105 }, (_, i) => (currentYear - i).toString());
  const months = Array.from({ length: 12 }, (_, i) => (i + 1).toString());
  const days = Array.from({ length: 31 }, (_, i) => (i + 1).toString());
  const hours = Array.from({ length: 12 }, (_, i) => (i + 1).toString());
  const minutes = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, "0"));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // GA Tracking
    gtag.event({
      action: "start_analysis",
      category: "engagement",
      label: "submit_birth_form"
    });

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

  const selectClassName = "w-full bg-white/5 border border-white/10 rounded-xl py-3 px-2 outline-none focus:ring-2 focus:ring-purple-500/50 transition-all appearance-none cursor-pointer text-sm text-center text-slate-200";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
      className="w-full max-w-md mx-auto"
    >
      <Card className="border-white/5 bg-slate-900/40 shadow-2xl shadow-purple-500/10 overflow-hidden">
        <form onSubmit={handleSubmit} onFocus={handleFormInteraction}>
          <CardHeader className="text-center pb-8">
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              開啟你的星際密碼
            </CardTitle>
            <CardDescription>輸入出生資訊，即刻生成個人專屬星盤</CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Sparkles className="w-3 h-3" /> 姓名 / 暱稱
              </Label>
              <Input
                placeholder="如何稱呼您？"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Calendar className="w-3 h-3" /> 出生日期
              </Label>
              <div className="grid grid-cols-3 gap-2">
                <select
                  className={selectClassName}
                  value={dateParts.year}
                  onChange={(e) => setDateParts({ ...dateParts, year: e.target.value })}
                >
                  {years.map(y => <option key={y} value={y} className="bg-slate-900">{y} 年</option>)}
                </select>
                <select
                  className={selectClassName}
                  value={dateParts.month}
                  onChange={(e) => setDateParts({ ...dateParts, month: e.target.value })}
                >
                  {months.map(m => <option key={m} value={m} className="bg-slate-900">{m} 月</option>)}
                </select>
                <select
                  className={selectClassName}
                  value={dateParts.day}
                  onChange={(e) => setDateParts({ ...dateParts, day: e.target.value })}
                >
                  {days.map(d => <option key={d} value={d} className="bg-slate-900">{d} 日</option>)}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Clock className="w-3 h-3" /> 出生時間
              </Label>
              <div className="grid grid-cols-3 gap-2">
                <select
                  className={selectClassName}
                  value={dateParts.ampm}
                  onChange={(e) => setDateParts({ ...dateParts, ampm: e.target.value })}
                >
                  <option value="AM" className="bg-slate-900">上午 AM</option>
                  <option value="PM" className="bg-slate-900">下午 PM</option>
                </select>
                <select
                  className={selectClassName}
                  value={dateParts.hour}
                  onChange={(e) => setDateParts({ ...dateParts, hour: e.target.value })}
                >
                  {hours.map(h => <option key={h} value={h} className="bg-slate-900">{h} 點</option>)}
                </select>
                <select
                  className={selectClassName}
                  value={dateParts.minute}
                  onChange={(e) => setDateParts({ ...dateParts, minute: e.target.value })}
                >
                  {minutes.map(m => <option key={m} value={m} className="bg-slate-900">{m} 分</option>)}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <MapPin className="w-3 h-3" /> 出生地點
              </Label>
              <Input
                placeholder="例如：台北市, 台灣"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                required
              />
              <div className="flex flex-wrap gap-1.5 pt-1">
                {["台北", "新北", "台中", "高雄", "桃園", "台南", "新竹", "香港", "澳門"].map((city) => (
                  <button
                    key={city}
                    type="button"
                    onClick={() => {
                      const formattedCity = city === "香港" || city === "澳門" ? city : `${city}市`;
                      setFormData({ ...formData, location: formattedCity });
                      handleFormInteraction();
                    }}
                    className="text-[11px] px-2.5 py-1 rounded-full bg-white/5 border border-white/10 hover:bg-purple-500/20 hover:border-purple-500/40 text-slate-300 hover:text-white transition-all cursor-pointer"
                  >
                    {city}
                  </button>
                ))}
              </div>
            </div>
          </CardContent>

          <CardFooter className="flex flex-col gap-4 mt-2">
            <Button
              type="submit"
              className="w-full py-7 text-lg font-bold group"
            >
              <Sparkles className="w-5 h-5 mr-2 group-hover:animate-spin-slow" />
              免費生成4000字專屬星盤
            </Button>
            <div className="space-y-3 px-4">
              <p className="text-[10px] text-center text-slate-500">
                * 準確的出生時間與地點是計算精確星盤的關鍵。如果您不確定時間，可選擇中午 12 點，但宮位與上升星座可能會有誤差。
              </p>
              <p className="text-[10px] text-center text-slate-600 border-t border-white/5 pt-3">
                免責聲明：本服務由 AI 自動生成解析內容，僅供個人參考與諮詢使用，不代表絕對的未來預測或醫療、法律建議。
              </p>
            </div>
          </CardFooter>
        </form>
      </Card>
    </motion.div>
  );
}
