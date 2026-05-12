// Updated: 2026-05-12T23:41:00
import { supabaseAdmin } from "./supabase";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Helper to get next 12 months starting from now
 */
function getNext12Months() {
  const months = [];
  const now = new Date();
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
    months.push(`${d.getFullYear()}年${d.getMonth() + 1}月`);
  }
  return months;
}

/**
 * Robust content generation with fallback
 */
async function generateWithFallback(genAI: any, prompt: string) {
  const modelsToTry = [
    process.env.GEMINI_MODEL || "gemini-1.5-flash",
    process.env.GEMINI_MODEL_BACKUP || "gemini-1.5-pro"
  ];

  let lastError = null;
  for (const modelName of modelsToTry) {
    try {
      console.log(`Paid Gen - Attempting with: ${modelName}`);
      const model = genAI.getGenerativeModel({ 
        model: modelName,
        generationConfig: { maxOutputTokens: 8192, temperature: 0.7 }
      });
      const result = await model.generateContent(prompt);
      const text = (await result.response).text().trim();
      
      if (text && text.includes("{")) {
        // Clean JSON
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        return JSON.parse(jsonMatch ? jsonMatch[0] : text);
      }
    } catch (err: any) {
      console.error(`Paid Gen Error with ${modelName}:`, err.message);
      lastError = err;
    }
  }
  throw lastError || new Error("All models failed");
}

export async function generateAndEmailReport(orderId: string) {
  try {
    const { data: order, error } = await supabaseAdmin
      .from("orders")
      .select("*")
      .eq("order_id", orderId)
      .single();

    if (error || !order) throw new Error("Order not found");

    const allMonths = getNext12Months();
    const phase1Months = allMonths.slice(0, 6);
    const phase2Months = allMonths.slice(6, 12);

    let rawTypes = order.product_type.includes(",") 
      ? order.product_type.split(",").map((t: string) => t.trim())
      : [order.product_type];

    if (rawTypes.includes("bundle")) {
      const subTypes = ["yearly", "love", "career"];
      subTypes.forEach(st => { if (!rawTypes.includes(st)) rawTypes.push(st); });
    }
    const productTypes = rawTypes;

    let reportStore = order.report_content || {};
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    const chartInfo = JSON.stringify(order.chart_data);
    const userQuestions = order.questions && order.questions.length > 0 
      ? `\n使用者特別提問：\n${order.questions.join("\n")}` 
      : "";

    for (const type of productTypes) {
      let currentReport = reportStore[type] || {};
      if (currentReport.isComplete) continue;

      // PHASE 1: Core Analysis & First 6 Months
      if (!currentReport.phase1) {
        let p1Prompt = "";
        if (type === "love") {
          p1Prompt = `你是一位資深靈魂占星諮商師。撰寫《靈魂愛情報告：情緣與基因全書》第一部分。
          這是一份長篇報告的開頭，要求內容極度詳盡且具備心理深度：
          1. 靈魂愛情基因 (1500字以上)：深度解析金星(吸引力與審美)與月亮(內在安全感)的落位、星座與相位。探討使用者在關係中最核心的渴望。
          2. 情感宿命模式 (1500字以上)：深度解析第五宮(戀愛宮)與第七宮(伴侶宮)的宮頭、宮主星與宮內行星。解析使用者為何總是被特定類型的人吸引。
          以 JSON 回傳：{ "title": "靈魂愛情報告：情緣與基因全書", "intro": "這是一份關於您靈魂深處情感密碼的完整報告...", "sections": [{ "title": "第一章：金月交織的愛情基因", "content": "" }, { "title": "第二章：宿命宮位的情感輪迴", "content": "" }] }。
          星盤數據：${chartInfo}`;
        } else if (type === "career") {
          p1Prompt = `你是一位職業占星顧問。撰寫《事業財富地圖》第一部分。深度解析職涯天賦與金錢能量。以 JSON 回傳：{ "title": "事業財富地圖", "intro": "", "sections": [{ "title": "天賦定位", "content": "" }] }。星盤：${chartInfo}`;
        } else if (type === "bundle") {
          p1Prompt = `你是一位全知占星宗師。撰寫極致奢華的《旗艦版：靈魂全書》第一部分。
          內容包含：
          1. 年度核心主題與靈魂使命 (1000字以上)。
          2. 前 6 個月的超深度預測：${phase1Months.join(", ")}。要求每個月份 500 字以上。
          3. 本命愛情與事業的天賦基因全解析。
          以 JSON 回傳：{ "title": "旗艦版：靈魂全書", "intro": "", "yearly_theme": { "keyword": "", "analysis": "" }, "sections": [{ "title": "靈魂天賦基因解析", "content": "" }], "monthly_forecasts": [{ "month": "", "focus": "", "details": "", "warnings": "" }] }。
          星盤數據：${chartInfo}`;
        } else {
          p1Prompt = `你是一位古典占星大師。為客戶撰寫《12個月靈魂指南》第一部分。
          內容包含：
          1. 年度核心主題解析 (1000字以上)。
          2. 前 6 個月的超深度預測：${phase1Months.join(", ")}。要求每個月份 500 字以上。
          以 JSON 回傳：{ "title": "12個月靈魂年度指南", "intro": "", "yearly_theme": { "keyword": "", "analysis": "" }, "monthly_forecasts": [{ "month": "", "focus": "", "details": "", "warnings": "" }] }。
          星盤數據：${chartInfo}`;
        }

        const p1Data = await generateWithFallback(genAI, p1Prompt);
        currentReport = { ...p1Data, phase1: true };
        reportStore[type] = currentReport;
        await supabaseAdmin.from("orders").update({ report_content: reportStore }).eq("order_id", orderId);
      }

      // PHASE 2: Remaining 6 Months & Summary
      if (!currentReport.isComplete) {
        let p2Prompt = "";
        if (type === "love") {
          p2Prompt = `你是一位靈魂占星諮商師。續寫《靈魂愛情報告》第二部分。
          要求內容深度且實用：
          1. 靈魂伴侶畫像精準描述 (1000字以上)：從星盤特徵推導出與您最契合的靈魂伴侶特徵(性格、能量特質、甚至可能遇到的情境)。
          2. 未來 12 個月桃花轉折預測 (1500字以上)：詳細解析未來一年中，金星、木星與火星帶來的具體戀愛機緣月份。
          3. 給靈魂的情感修煉建議。
          以 JSON：{ "sections": [{ "title": "第三章：尋找那顆遺落的星：理想伴侶畫像", "content": "" }, { "title": "第四章：未來一年情緣轉折點", "content": "" }, { "title": "第五章：靈魂的親密修煉建議", "content": "" }], "lucky_guide": { "colors": [], "dates": [], "mantra": "" } }。
          星盤：${chartInfo}`;
        } else if (type === "career") {
          p2Prompt = `續寫《事業財富地圖》第二部分。未來大運與顯化建議。以 JSON：{ "sections": [{ "title": "事業大運", "content": "" }], "lucky_guide": { "colors": [], "dates": [], "mantra": "" } }。星盤：${chartInfo}`;
        } else if (type === "bundle") {
          p2Prompt = `你是一位全知占星宗師。續寫《旗艦版：靈魂全書》第二部分。
          本章節的核心任務是針對以下使用者的提問，進行專門的「占星深層諮商」：
          ${userQuestions}
          
          內容包含：
          1. 後 6 個月的超深度預測：${phase2Months.join(", ")}。要求每個月份 500 字以上。
          2. 事業、愛情、健康三大深度專題 (各800字)。
          3. 重磅專屬章節：【靈魂提問箱：大師諮商回響】。
             要求：針對使用者的「每一個提問」，結合其本命星盤相位與未來流年運勢，提供 800-1000 字的深度解答。內容需包含「星盤成因分析」、「當下運勢對應」與「具體解決之道」。
          以 JSON：{ "monthly_forecasts": [{ "month": "", "focus": "", "details": "", "warnings": "" }], "thematic_analysis": { "career": "", "love": "", "health": "" }, "sections": [{ "title": "【靈魂提問箱：大師諮商回響】", "content": "" }], "lucky_guide": { "colors": [], "dates": [], "mantra": "" } }。
          星盤數據：${chartInfo}`;
        } else {
          p2Prompt = `你是一位古典占星大師。續寫《12個月靈魂指南》第二部分。
          內容包含：
          1. 後 6 個月的超深度預測：${phase2Months.join(", ")}。要求每個月份 500 字以上。
          2. 三大專題：事業財富、愛情關係、成長健康 (各800字)。
          3. 幸運指南。
          以 JSON 回傳：{ "monthly_forecasts": [{ "month": "", "focus": "", "details": "", "warnings": "" }], "thematic_analysis": { "career": "", "love": "", "health": "" }, "lucky_guide": { "colors": [], "dates": [], "mantra": "" } }。
          星盤數據：${chartInfo}`;
        }

        const p2Data = await generateWithFallback(genAI, p2Prompt);

        if (type === "love" || type === "career") {
          currentReport.sections = [...(currentReport.sections || []), ...(p2Data.sections || [])];
          currentReport.lucky_guide = p2Data.lucky_guide || currentReport.lucky_guide;
        } else if (type === "bundle") {
          currentReport.monthly_forecasts = [...(currentReport.monthly_forecasts || []), ...(p2Data.monthly_forecasts || [])];
          currentReport.thematic_analysis = p2Data.thematic_analysis || currentReport.thematic_analysis;
          currentReport.sections = [...(currentReport.sections || []), ...(p2Data.sections || [])];
          currentReport.lucky_guide = p2Data.lucky_guide || currentReport.lucky_guide;
        } else {
          currentReport.monthly_forecasts = [...(currentReport.monthly_forecasts || []), ...(p2Data.monthly_forecasts || [])];
          currentReport.thematic_analysis = p2Data.thematic_analysis || currentReport.thematic_analysis;
          currentReport.lucky_guide = p2Data.lucky_guide || currentReport.lucky_guide;
        }
        
        currentReport.isComplete = true;
        reportStore[type] = currentReport;
        await supabaseAdmin.from("orders").update({ report_content: reportStore }).eq("order_id", orderId);
      }
    }

    // Email Notification
    const reportUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/report/${orderId}`;
    try {
      const fromName = process.env.RESEND_FROM_NAME || "Aistrology";
      const fromEmail = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";
      await resend.emails.send({
        from: `${fromName} <${fromEmail}>`,
        to: [order.email],
        subject: `您的靈魂解析報告已撰寫完成！`,
        html: `<div style="font-family: sans-serif; padding: 20px;"><h2>解析完成</h2><p>立即點擊下方連結查看您的靈魂指南：</p><a href="${reportUrl}" style="background-color: #6d28d9; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">查看報告</a></div>`,
      });
    } catch (e) { console.error("Email error:", e); }

  } catch (err) { console.error("Report gen error:", err); }
}
