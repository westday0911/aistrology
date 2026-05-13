import { GoogleGenerativeAI } from "@google/generative-ai";
import { supabaseAdmin } from "./supabase";

// --- HELPERS ---
function getNext12Months() {
  const months = [];
  const now = new Date();
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
    months.push(`${d.getFullYear()}/${d.getMonth() + 1}`);
  }
  return months;
}

async function generateWithFallback(genAI: any, prompt: string) {
  const modelsToTry = [
    process.env.GEMINI_MODEL || "gemini-2.5-flash",
    process.env.GEMINI_MODEL_BACKUP || "gemini-2.5-flash"
  ];

  let lastError = null;
  for (const modelName of modelsToTry) {
    try {
      console.log(`[AI] Attempting with: ${modelName}`);
      const model = genAI.getGenerativeModel({ 
        model: modelName,
        generationConfig: { 
          responseMimeType: "application/json",
          maxOutputTokens: 8192 // Ensure maximum allowed output
        }
      });
      
      const result = await model.generateContent(prompt);
      const text = result.response.text();
      
      try {
        return JSON.parse(text);
      } catch (parseErr) {
        console.log(`[AI] Direct JSON parse failed for ${modelName}, cleaning...`);
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        let cleaned = jsonMatch ? jsonMatch[0] : text;
        
        try {
          // 1. Fix trailing commas
          cleaned = cleaned.replace(/,\s*([\}\]])/g, '$1');
          // 2. Fix bad escaped characters
          cleaned = cleaned.replace(/\\(?!["\\/bfnrtu])/g, "\\\\");
          // 3. Fix literal newlines in strings
          cleaned = cleaned.replace(/[\x00-\x1F]/g, " ");
          return JSON.parse(cleaned);
        } catch (cleanErr) {
          console.log("[AI] Deep JSON clean failed, attempting truncation auto-close...");
          // Fallback: If it was truncated (very common for 8000+ tokens), try to close the JSON
          const closePatterns = [
            '"]}', '"}', '}]}', ']}', '"]}]}'
          ];
          for (const pattern of closePatterns) {
            try { return JSON.parse(cleaned + pattern); } catch (e) {}
          }
          throw parseErr;
        }
      }
    } catch (err: any) {
      lastError = err;
      console.error(`[AI] Error with ${modelName}:`, err.message);
      if (err.message?.includes("503")) {
        console.log("Model busy, waiting 2 seconds...");
        await new Promise(r => setTimeout(r, 2000));
      }
    }
  }
  throw lastError || new Error("All models failed");
}

// --- MAIN ENGINE ---
export async function generateAndEmailReport(orderId: string) {
  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    
    // 1. Fetch Order
    const { data: order, error: orderErr } = await supabaseAdmin
      .from("orders")
      .select("*")
      .eq("order_id", orderId)
      .single();

    if (orderErr || !order) return;

    // 2. Concurrency Lock (30s)
    const lastUpdate = new Date(order.updated_at).getTime();
    const now = new Date().getTime();
    if (now - lastUpdate < 30000 && now - lastUpdate > 1000) {
      console.log(`[Lock] Process already active for ${orderId}. Skipping.`);
      return;
    }

    const allMonths = getNext12Months();
    const phase1Months = allMonths.slice(0, 6);
    const phase2Months = allMonths.slice(6, 12);

    let productTypes = order.product_type.includes(",") 
      ? order.product_type.split(",").map((t: string) => t.trim())
      : [order.product_type];

    if (productTypes.includes("bundle")) {
      ["yearly", "love", "career"].forEach(st => { if (!productTypes.includes(st)) productTypes.push(st); });
    }

    let reportStore = order.report_content || {};
    const chartInfo = JSON.stringify(order.chart_data);
    const userQuestions = order.questions && order.questions.length > 0 
      ? `\n使用者提問：\n${order.questions.join("\n")}` : "";

    // 3. Process each Chapter
    for (const type of productTypes) {
      let currentReport = reportStore[type] || {};
      if (currentReport.isComplete) continue;

      if (type === "bundle") {
        // --- BUNDLE CHAPTERS (Granular Checkpointing) ---
        
        // 1A. Yearly Theme
        if (!currentReport.yearly_theme) {
          console.log(`[FullDepth] Phase 1A: Yearly Theme for ${orderId}`);
          const prompt = `你是一位全知占星宗師。撰寫《旗艦版：靈魂全書》年度核心主題與靈魂使命。要求：深度解析，1500字以上。回傳 JSON: { "title": "旗艦版：靈魂全書", "yearly_theme": { "keyword": "", "analysis": "" } }。星盤：${chartInfo}`;
          const data = await generateWithFallback(genAI, prompt);
          currentReport = { ...currentReport, ...data };
          reportStore[type] = currentReport;
          await supabaseAdmin.from("orders").update({ report_content: reportStore }).eq("order_id", orderId);
        }

        // 1B. Months 1-6
        if (!currentReport.monthly_forecasts || currentReport.monthly_forecasts.length < 6) {
          console.log(`[FullDepth] Phase 1B: Months 1-6 for ${orderId}`);
          const prompt = `續寫《旗艦版：靈魂全書》。撰寫前 6 個月預測：${phase1Months.join(", ")}。要求：每個月份 500 字以上。回傳 JSON: { "monthly_forecasts": [{ "month": "", "focus": "", "details": "", "warnings": "" }] }。星盤：${chartInfo}`;
          const data = await generateWithFallback(genAI, prompt);
          currentReport.monthly_forecasts = [...(currentReport.monthly_forecasts || []), ...(data.monthly_forecasts || [])];
          reportStore[type] = currentReport;
          await supabaseAdmin.from("orders").update({ report_content: reportStore }).eq("order_id", orderId);
        }

        // 2A. Months 7-12
        if (!currentReport.monthly_forecasts || currentReport.monthly_forecasts.length < 12) {
          console.log(`[FullDepth] Phase 2A: Months 7-12 for ${orderId}`);
          const prompt = `續寫《旗艦版：靈魂全書》。撰寫後 6 個月預測：${phase2Months.join(", ")}。要求：每個月份 500 字以上。回傳 JSON: { "monthly_forecasts": [{ "month": "", "focus": "", "details": "", "warnings": "" }] }。星盤：${chartInfo}`;
          const data = await generateWithFallback(genAI, prompt);
          currentReport.monthly_forecasts = [...(currentReport.monthly_forecasts || []), ...(data.monthly_forecasts || [])];
          reportStore[type] = currentReport;
          await supabaseAdmin.from("orders").update({ report_content: reportStore }).eq("order_id", orderId);
        }

        // 2B. Thematics & Q&A
        if (!currentReport.thematic_analysis) {
          console.log(`[FullDepth] Phase 2B: Thematic & Questions for ${orderId}`);
          const qText = userQuestions ? `解答提問：${userQuestions}` : "年度靈魂建議。";
          const prompt = `續寫《旗艦版：靈魂全書》。撰寫事業、愛情、健康專題(各800字)與${qText}。回傳 JSON: { "thematic_analysis": { "career": "", "love": "", "health": "" }, "sections": [{ "title": "靈魂指引", "content": "" }], "lucky_guide": { "colors": [], "dates": [], "mantra": "" } }。星盤：${chartInfo}`;
          const data = await generateWithFallback(genAI, prompt);
          currentReport = { ...currentReport, ...data };
          reportStore[type] = currentReport;
          await supabaseAdmin.from("orders").update({ report_content: reportStore }).eq("order_id", orderId);
        }

        // Mark bundle complete only when ALL sub-phases are done
        const bundleComplete = currentReport.yearly_theme &&
          currentReport.monthly_forecasts?.length >= 12 &&
          currentReport.thematic_analysis;
        if (bundleComplete && !currentReport.isComplete) {
          currentReport.isComplete = true;
          reportStore[type] = currentReport;
          await supabaseAdmin.from("orders").update({ report_content: reportStore }).eq("order_id", orderId);
        }
      } else {
        // --- SINGLE REPORT ---
        console.log(`[FullDepth] Generating Single Report: ${type} for ${orderId}`);
        const prompt = `你是一位資深占星家。撰寫完整《${type}》報告。要求：3000字以上，內容深入詳實，並分多個段落。
必須嚴格使用以下簡單 JSON 格式回傳（不要使用任何其他格式）：
{
  "title": "報告標題",
  "intro": "前言與引言...",
  "sections": [
    { "title": "章節標題1", "content": "該章節的完整內容..." },
    { "title": "章節標題2", "content": "該章節的完整內容..." }
  ]
}
星盤：${chartInfo}`;
        const data = await generateWithFallback(genAI, prompt);
        currentReport = { ...data, isComplete: true };
        reportStore[type] = currentReport;
        await supabaseAdmin.from("orders").update({ report_content: reportStore }).eq("order_id", orderId);
      }

      // 4. FINAL SYNC to MongoDB
      // Schema keys: yearly, love, career, full (bundle maps to 'full')
      if (currentReport.isComplete) {
        try {
          const dbConnect = (await import("./db")).default;
          const Chart = (await import("../models/Chart")).default;
          await dbConnect();
          const birthInfo = order.birth_data;
          const mongoKey = type === "bundle" ? "full" : type; // Fix: bundle -> full
          if (birthInfo) {
            await Chart.findOneAndUpdate(
              { "input.birthDate": birthInfo.birthDate, "input.birthTime": birthInfo.birthTime, "input.location": birthInfo.location },
              { $set: { [`reports.${mongoKey}`]: { content: currentReport, generatedAt: new Date(), isPaid: true } } },
              { upsert: true }
            );
            console.log(`[Sync] Successfully synced ${type} (as '${mongoKey}') to MongoDB`);
          }
        } catch (err) { console.error("Sync Error:", err); }
      }
    }
  } catch (err) {
    console.error("Critical Generation Error:", err);
    // Release the lock immediately so the frontend can trigger a retry on the next poll
    try {
      const pastDate = new Date(Date.now() - 10 * 60 * 1000).toISOString();
      await supabaseAdmin.from("orders").update({ updated_at: pastDate }).eq("order_id", orderId);
      console.log(`[Lock] Lock released for ${orderId} due to error.`);
    } catch (unlockErr) {
      console.error("Failed to release lock:", unlockErr);
    }
  }
}
