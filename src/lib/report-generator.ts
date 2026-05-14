import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
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

async function generateWithFallback(genAI: any, prompt: string, schema?: any) {
  const modelsToTry = [
    process.env.GEMINI_MODEL || "gemini-2.5-flash",
    process.env.GEMINI_MODEL_BACKUP || "gemini-2.5-flash"
  ];

  let lastError = null;
  for (const modelName of modelsToTry) {
    try {
      console.log(`[AI] Attempting with: ${modelName} (Structured Mode)`);
      const model = genAI.getGenerativeModel({ 
        model: modelName,
        generationConfig: { 
          responseMimeType: "application/json",
          responseSchema: schema,
          maxOutputTokens: 8192
        }
      });
      
      const result = await model.generateContent(prompt);
      const text = result.response.text();
      
      try {
        return JSON.parse(text);
      } catch (parseErr) {
        console.log(`[AI] JSON parse failed, attempting fallback cleaning...`);
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        let cleaned = jsonMatch ? jsonMatch[0] : text;
        return JSON.parse(cleaned);
      }
    } catch (err: any) {
      console.error(`[AI] Error with ${modelName}:`, err.message);
      lastError = err;
      if (err.message?.includes("503")) {
        console.log("Model busy, waiting 2 seconds...");
        await new Promise(r => setTimeout(r, 2000));
      }
    }
  }
  throw lastError || new Error("All models failed generation");
}

// --- SCHEMAS ---
const STANDARD_REPORT_SCHEMA = {
  type: SchemaType.OBJECT,
  properties: {
    title: { type: SchemaType.STRING },
    intro: { type: SchemaType.STRING },
    sections: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          title: { type: SchemaType.STRING },
          content: { type: SchemaType.STRING }
        },
        required: ["title", "content"]
      }
    }
  },
  required: ["title", "intro", "sections"]
};

const YEARLY_REPORT_SCHEMA = {
  type: SchemaType.OBJECT,
  properties: {
    title: { type: SchemaType.STRING },
    intro: { type: SchemaType.STRING },
    yearly_theme: {
      type: SchemaType.OBJECT,
      properties: {
        keyword: { type: SchemaType.STRING },
        analysis: { type: SchemaType.STRING }
      },
      required: ["keyword", "analysis"]
    },
    monthly_forecasts: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          month: { type: SchemaType.STRING },
          focus: { type: SchemaType.STRING },
          details: { type: SchemaType.STRING },
          warnings: { type: SchemaType.STRING }
        },
        required: ["month", "focus", "details", "warnings"]
      }
    }
  },
  required: ["title", "intro", "yearly_theme", "monthly_forecasts"]
};

// --- MAIN ENGINE ---
export async function generateAndEmailReport(orderId: string) {
  let reportStore: any = {};
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

    reportStore = order.report_content || {};
    const chartInfo = JSON.stringify(order.chart_data);
    const userQuestions = order.questions && order.questions.length > 0 
      ? `\n使用者提問：\n${order.questions.join("\n")}` : "";

    // 3. Process each Chapter
    for (const type of productTypes) {
      let currentReport = reportStore[type] || {};
      if (currentReport.isComplete) continue;

      console.log(`[FullDepth] Generating Report: ${type} for ${orderId}`);
      
      let prompt = "";
      let schema: any = STANDARD_REPORT_SCHEMA;
      
      if (type === "bundle") {
        prompt = `你是一位資深占星宗師。撰寫《旗艦版：靈魂全書》。
專注於：1. 靈魂使命與業力課題(南北交點深析) 2. 人格底層邏輯(日月升深度化學反應) 3. 星盤特殊格局與天命 4. 專屬開運指南(幸運色/水晶/能量補充)。
${userQuestions ? `請在最後一個章節專門解答使用者的提問：${userQuestions}` : ""}
【嚴格禁止】：絕對不要寫流年運勢、月份預測，也不要寫愛情或事業的瑣碎細節。
要求：3000字以上，內容深入詳實，並分多個段落。
星盤：${chartInfo}`;

      } else if (type === "love") {
        prompt = `你是一位資深占星家。撰寫《愛情報告》。
專攻本命盤的情感與親密關係格局。包含：靈魂深處的愛情觀(金星/火星)、容易吸引到的對象類型與真正適合的伴侶、感情中的盲點與業力防雷指南、婚姻與長久關係的經營建議。
【嚴格禁止】：絕對不要寫流年運勢。
要求：3000字以上，內容深入詳實。
星盤：${chartInfo}`;

      } else if (type === "career") {
        prompt = `你是一位資深占星家。撰寫《事業財富地圖》。
專攻本命盤的世俗成就與金錢格局。包含：核心天賦與隱藏潛能(水/木/土/中天)、正財運與偏財運格局、最容易發光發熱的職業賽道、職場人際與創業潛能。
【嚴格禁止】：絕對不要寫流年運勢。
要求：3000字以上，內容深入詳實。
星盤：${chartInfo}`;

      } else if (type === "yearly") {
        schema = YEARLY_REPORT_SCHEMA;
        prompt = `你是一位資深占星家。撰寫《年度專書》。
專攻未來一年的動態運勢預測。包含：年度核心挑戰與重大機會(木土換座)、未來12個月每個月的詳細流年運勢、重要星象避災提醒。
要求：4000字以上，內容極度深入詳實。
星盤：${chartInfo}`;
      }

      const data = await generateWithFallback(genAI, prompt, schema);
      
      // AI Defense for yearly report to ensure array length and correct month labels
      if (type === "yearly" && data.monthly_forecasts) {
        let newMonths = data.monthly_forecasts;
        newMonths = newMonths.slice(0, 12);
        newMonths.forEach((m: any, i: number) => { m.month = allMonths[i]; });
        data.monthly_forecasts = newMonths;
      }
      
      currentReport = { ...data, isComplete: true };
      reportStore[type] = currentReport;
      await supabaseAdmin.from("orders").update({ report_content: reportStore }).eq("order_id", orderId);

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
      await supabaseAdmin.from("orders").update({ report_content: { ...reportStore, _lock: pastDate } }).eq("order_id", orderId);
      console.log(`[Lock] Lock released for ${orderId} due to error.`);
    } catch (unlockErr) {
      console.error("Failed to release lock:", unlockErr);
    }
  }
}
