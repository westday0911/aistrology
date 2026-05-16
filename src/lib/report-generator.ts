import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { supabaseAdmin } from "./supabase";
import { Resend } from "resend";
import { TRANSIT_DATA } from "./transit-data";

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
    process.env.GEMINI_MODEL || "gemini-1.5-flash",
    process.env.GEMINI_MODEL_BACKUP || "gemini-1.5-pro"
  ];

  const systemPrompt = `你是一位世界級的資深占星家與心理諮商師。
【絕對任務】：必須使用「繁體中文 (Traditional Chinese)」撰寫報告。
【風格要求】：語氣專業、深刻、充滿人文關懷，嚴禁簡短回答，嚴禁輸出任何非占星相關的垃圾內容。
【格式要求】：嚴格遵守提供的 JSON Schema，確保內容詳實，每一章節必須達到數百字的深度分析。`;

  let lastError = null;
  for (const modelName of modelsToTry) {
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        console.log(`[AI] Attempting with: ${modelName} (Attempt ${attempt})`);
        const model = genAI.getGenerativeModel({
          model: modelName,
          systemInstruction: systemPrompt,
          generationConfig: {
            responseMimeType: "application/json",
            responseSchema: schema,
            maxOutputTokens: 8192,
            temperature: 0.8
          }
        });

        const result = await model.generateContent(prompt);
        const text = result.response.text();

        // Log text preview to debug word count issues
        console.log(`[AI] Response received. Length: ${text.length} chars. Preview: ${text.substring(0, 100)}...`);

        try {
          return JSON.parse(text);
        } catch (parseErr) {
          console.log(`[AI] JSON parse failed, attempting fallback cleaning...`);
          const jsonMatch = text.match(/\{[\s\S]*\}/);
          let cleaned = jsonMatch ? jsonMatch[0] : text;
          return JSON.parse(cleaned);
        }
      } catch (err: any) {
        console.error(`[AI] Error with ${modelName} (Attempt ${attempt}):`, err.message);
        lastError = err;

        // If it's a transient error (503, 429), wait and retry same model
        if (err.message?.includes("503") || err.message?.includes("429") || err.message?.includes("overloaded")) {
          const waitTime = attempt * 3000 + Math.random() * 1000;
          console.log(`[AI] Model busy or limited, waiting ${Math.round(waitTime / 1000)}s before retry...`);
          await new Promise(r => setTimeout(r, waitTime));
          continue;
        }

        break; // Switch to next model for other errors
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

// Specialized schemas to force depth in Love and Career
const DEEP_LOVE_P1_SCHEMA = {
  type: SchemaType.OBJECT,
  properties: {
    title: { type: SchemaType.STRING },
    intro: { type: SchemaType.STRING },
    archetype_analysis: { type: SchemaType.STRING },
    attachment_style: { type: SchemaType.STRING },
    attraction_laws: { type: SchemaType.STRING },
    karmic_bonds: { type: SchemaType.STRING }
  },
  required: ["title", "intro", "archetype_analysis", "attachment_style", "attraction_laws", "karmic_bonds"]
};

const DEEP_LOVE_P2_SCHEMA = {
  type: SchemaType.OBJECT,
  properties: {
    shadow_side: { type: SchemaType.STRING },
    ideal_partner: { type: SchemaType.STRING },
    growth_wisdom: { type: SchemaType.STRING },
    current_strategy: { type: SchemaType.STRING }
  },
  required: ["shadow_side", "ideal_partner", "growth_wisdom", "current_strategy"]
};

const DEEP_CAREER_P1_SCHEMA = {
  type: SchemaType.OBJECT,
  properties: {
    title: { type: SchemaType.STRING },
    intro: { type: SchemaType.STRING },
    core_talents: { type: SchemaType.STRING },
    wealth_blueprint: { type: SchemaType.STRING },
    hidden_motivations: { type: SchemaType.STRING },
    childhood_influence: { type: SchemaType.STRING }
  },
  required: ["title", "intro", "core_talents", "wealth_blueprint", "hidden_motivations", "childhood_influence"]
};

const DEEP_CAREER_P2_SCHEMA = {
  type: SchemaType.OBJECT,
  properties: {
    best_industries: { type: SchemaType.STRING },
    professional_network: { type: SchemaType.STRING },
    entrepreneurial_risk: { type: SchemaType.STRING },
    ten_year_vision: { type: SchemaType.STRING }
  },
  required: ["best_industries", "professional_network", "entrepreneurial_risk", "ten_year_vision"]
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

function simplifyChartData(data: any) {
  if (!data) return "No chart data available";
  
  // Try all possible data locations (sometimes it's nested in results, sometimes direct)
  let rawPlanets = data.results || (data.planets ? data.planets : (Array.isArray(data) ? data : null));
  
  // If still not found, check if it's deeply nested (e.g. data.data.results)
  if (!rawPlanets && data.data) {
    rawPlanets = data.data.results || data.data.planets;
  }

  if (!rawPlanets) return "Warning: Could not extract planetary data from provided chart object.";

  const planets = Array.isArray(rawPlanets) 
    ? rawPlanets.map((p: any) => `${p.name}: ${p.sign} ${typeof p.longitude === 'number' ? p.longitude.toFixed(2) : ''}°`).join(", ")
    : "Format Error";

  const houses = data.meta?.houses 
    ? data.meta.houses.map((h: any, i: number) => `House ${i + 1}: ${typeof h === 'number' ? h.toFixed(2) : h}°`).join(", ")
    : "No house data";

  return `【行星位置】：${planets} | 【宮位起點】：${houses}`;
}

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

    // 🌟 REORDER: yearly -> love -> career -> bundle
    const generationOrder = ["yearly", "love", "career", "bundle"];
    productTypes.sort((a: string, b: string) => generationOrder.indexOf(a) - generationOrder.indexOf(b));

    reportStore = order.report_content || {};
    const chartInfo = simplifyChartData(order.chart_data);
    
    // 🌟 VERIFICATION LOG: See exactly what the AI is receiving
    console.log(`\n[MainEngine] 🛡️ VERIFYING CHART DATA FOR ${orderId}:`);
    console.log(`[Data] ${chartInfo}`);

    const customerName = order.customer_name || order.birth_data?.customer_name || "尊貴的星友";
    const userQuestions = order.questions && order.questions.length > 0
      ? `\n使用者提問：\n${order.questions.join("\n")}` : "";

    // Helper to update progress status in DB
    const setProgress = async (msg: string) => {
      reportStore._progress = { message: msg, updatedAt: new Date().toISOString() };
      await supabaseAdmin.from("orders").update({ report_content: reportStore }).eq("order_id", orderId);
    };

    // 3. Process each Chapter
    for (const type of productTypes) {
      let currentReport = reportStore[type] || {};
      if (currentReport.isComplete) continue;

      console.log(`\n🚀 [MainEngine] Starting Generation: ${type.toUpperCase()} for Order ${orderId}`);

      let prompt = "";
      let schema: any = STANDARD_REPORT_SCHEMA;

      if (type === "bundle") {
        await setProgress("正在讀取靈魂星圖，撰寫《靈魂全書》...");
        console.log(`[Bundle] ➔ Generating Flagship Soul Book...`);
        const soulPrompt = `你是一位資深占星宗師。正在為一位尋求生命真相的靈魂撰寫《旗艦版：靈魂全書》。
【核心目標】：撰寫一份超越 6000 字、極具哲學深度與靈性啟發力量的旗艦報告。
【要求細節】：
1. 靈魂使命與業力課題：深度解析南北交點、土星的業力枷鎖，揭示靈魂在輪迴中必須完成的進化方向。
2. 人格底層邏輯：日月升三位一體的深度化學反應，包含您的潛意識動機與外在人格的巨大張力。
3. 星盤特殊格局：分析大三角、T-Square 或特殊相位集結對生命能量的具體影響（如命主星、關鍵合相）。
4. 專屬開運指南：結合您的個人星盤，給予具體的冥想、顏色、水晶、居住方位與能量補充建議。
5. ⚠️【靈魂對答 - 絕對核心項目】：${userQuestions ? `
針對使用者提出的以下問題，進行極其詳盡、溫暖且具備占星專業度的「一對一深度解答」。
你必須逐條列出問題並給予每題至少 500-1000 字的深度對話，總字數需超越 2000 字。
問題清單：${userQuestions}` : "若使用者未提問，請針對其星盤中最具挑戰性的相位，提供一份關於靈魂覺醒、生命跨越與內在療癒的期許與具體建議。"}

【寫作風格】：風格需優美如散文，深度如心理顧問，且必須具備強大的情感共鳴力。
星盤：${chartInfo}`;

        const SOUL_SCHEMA = {
          type: SchemaType.OBJECT,
          properties: {
            title: { type: SchemaType.STRING },
            intro: { type: SchemaType.STRING },
            soul_mission: { type: SchemaType.STRING },
            personality_logic: { type: SchemaType.STRING },
            chart_patterns: { type: SchemaType.STRING },
            lucky_guide: { type: SchemaType.STRING },
            user_qa: { type: SchemaType.STRING }
          },
          required: ["title", "intro", "soul_mission", "personality_logic", "chart_patterns", "lucky_guide", "user_qa"]
        };

        const soulData = await generateWithFallback(genAI, soulPrompt, SOUL_SCHEMA);
        
        currentReport = {
          title: soulData.title,
          intro: soulData.intro,
          sections: [
            { title: "靈魂使命與業力課題", content: soulData.soul_mission },
            { title: "人格底層邏輯解析", content: soulData.personality_logic },
            { title: "星盤特殊格局影響", content: soulData.chart_patterns },
            { title: "專屬開運與能量建議", content: soulData.lucky_guide },
            { title: "靈魂覺醒與深度對話 (Q&A)", content: soulData.user_qa }
          ],
          isComplete: true
        };
        
        reportStore[type] = currentReport;
        await supabaseAdmin.from("orders").update({ report_content: reportStore }).eq("order_id", orderId);

      } else if (type === "love") {
        // TWO-PHASE for Love (5000+ words)
        if (!currentReport.p1Complete) {
          await setProgress("正在分析情感引力，撰寫《愛情報告》上篇...");
          console.log(`[Love] ➔ Phase 1/2: Soulmate Analysis...`);
          const p1Prompt = `
專攻本命盤的情感與親密關係格局。包含：靈魂深處的愛情觀(金星/火星)、容易吸引到的對象類型與真正適合的伴侶、感情中的盲點與業力防雷指南、婚姻與長久關係的經營建議。
【嚴格禁止】：絕對不要寫流年運勢。
要求：3000字以上，內容深入詳實。
星盤：${chartInfo}`;
          const p1Data = await generateWithFallback(genAI, p1Prompt, DEEP_LOVE_P1_SCHEMA);

          const sections = [
            { title: "內在愛情原形", content: p1Data.archetype_analysis },
            { title: "情感依附類型", content: p1Data.attachment_style },
            { title: "吸引力法則", content: p1Data.attraction_laws },
            { title: "宿命緣分", content: p1Data.karmic_bonds }
          ];

          currentReport = { title: p1Data.title, intro: p1Data.intro, sections: sections, p1Complete: true };
          reportStore[type] = currentReport;
          await supabaseAdmin.from("orders").update({ report_content: reportStore }).eq("order_id", orderId);
        }

        if (currentReport.p1Complete && !currentReport.p2Complete) {
          await setProgress("正在推算情感課題，撰寫《愛情報告》下篇...");
          console.log(`[Love] ➔ Phase 2/2: Practical Relationship Wisdom...`);
          const p2Prompt = `你是一位資深占星家。延續《愛情報告》，撰寫《實戰經營篇》。
【指令】：請針對 Schema 中的每一個欄位撰寫極度詳實的分析，內容要專業且具洞察力。總字數需超過 2500 字。
星盤：${chartInfo}`;
          const p2Data = await generateWithFallback(genAI, p2Prompt, DEEP_LOVE_P2_SCHEMA);

          const newSections = [
            { title: "愛情的陰影面與業力挑戰", content: p2Data.shadow_side },
            { title: "理想伴侶畫像深度解析", content: p2Data.ideal_partner },
            { title: "情感長久經營智慧", content: p2Data.growth_wisdom },
            { title: "目前的脫單與穩固策略", content: p2Data.current_strategy }
          ];

          currentReport.sections = [...(currentReport.sections || []), ...newSections];
          currentReport.p2Complete = true;
          currentReport.isComplete = true;
        }

      } else if (type === "career") {
        // TWO-PHASE for Career (5000+ words)
        if (!currentReport.p1Complete) {
          await setProgress("正在掃描天賦羅盤，撰寫《事業財富地圖》上篇...");
          console.log(`[Career] ➔ Phase 1/2: Talent & Wealth Blueprint...`);
          const p1Prompt = `
專攻本命盤的世俗成就與金錢格局。包含：核心天賦與隱藏潛能(水/木/土/中天)、正財運與偏財運格局、最容易發光發熱的職業賽道、職場人際與創業潛能。
【嚴格禁止】：絕對不要寫流年運勢。
要求：3000字以上，內容深入詳實。
星盤：${chartInfo}`;
          const p1Data = await generateWithFallback(genAI, p1Prompt, DEEP_CAREER_P1_SCHEMA);

          const sections = [
            { title: "核心職場天賦解析", content: p1Data.core_talents },
            { title: "個人財富格局藍圖", content: p1Data.wealth_blueprint },
            { title: "潛意識中的職涯驅動力", content: p1Data.hidden_motivations },
            { title: "早期環境對財富能量的影響", content: p1Data.childhood_influence }
          ];

          currentReport = { title: p1Data.title, intro: p1Data.intro, sections: sections, p1Complete: true };
          reportStore[type] = currentReport;
          await supabaseAdmin.from("orders").update({ report_content: reportStore }).eq("order_id", orderId);
        }

        if (currentReport.p1Complete && !currentReport.p2Complete) {
          await setProgress("正在佈局財富賽道，撰寫《事業財富地圖》下篇...");
          console.log(`[Career] ➔ Phase 2/2: Industry Strategy & Long-term Vision...`);
          const p2Prompt = `你是一位資深占星家。延續《事業財富地圖》，撰寫《賽道佈局篇》。
【指令】：請針對 Schema 中的每一個欄位撰寫深度顧問級別的分析。總字數需超過 2500 字。
星盤：${chartInfo}`;
          const p2Data = await generateWithFallback(genAI, p2Prompt, DEEP_CAREER_P2_SCHEMA);

          const newSections = [
            { title: "最佳職業賽道與產業建議", content: p2Data.best_industries },
            { title: "職場人際經營與貴人運勢", content: p2Data.professional_network },
            { title: "創業潛能評估與風險預警", content: p2Data.entrepreneurial_risk },
            { title: "未來十年的財富成長願景", content: p2Data.ten_year_vision }
          ];

          currentReport.sections = [...(currentReport.sections || []), ...newSections];
          currentReport.p2Complete = true;
          currentReport.isComplete = true;
        }
      } else if (type === "yearly") {
        // TWO-PHASE GENERATION for Yearly to support 400-500 words per month
        const p1Months = allMonths.slice(0, 6);
        const p2Months = allMonths.slice(6, 12);

        // Phase 1: Theme + First 6 Months
        if (!currentReport.p1Complete) {
          await setProgress("正在觀察木土運行，撰寫《年度專書》上半年...");
          console.log(`[Yearly] Generating Phase 1 (Months 1-6) for ${orderId}`);

          // 🌟 Dynamic Transit Injection for Phase 1
          const p1Events = p1Months.map(m => {
            const events = TRANSIT_DATA[m] || [];
            return `【${m} 真實星象】：${events.length > 0 ? events.join("；") : "穩定運行中"}`;
          }).join("\n");

          const p1Prompt = `你是一位資深占星家。撰寫《年度專書：上半年》。
【核心星盤依據】：${chartInfo}
【當月真實天文事件參考】：
${p1Events}

【要求】：
1. 年度核心命題（yearly_theme.analysis 撰寫約 600 字深度總論）
2. 年度核心挑戰與重大機會（分析木星、土星換座對本命盤的具體衝擊）
3. 前 6 個月(${p1Months.join(", ")})的詳細流年運勢。
   - 每個月的「details」字數必須達到 500 字以上。
   - 【關鍵指令】：必須結合上方提供的「真實天文事件」進行解析。
   - 禁止虛構日期。內容必須細分：事業發展、感情桃花、財富運勢與身心健康。
【指令】：禁止提供通用建議。必須嚴格計算流年行星與上述本命數據的相位與宮位影響。
`;
          const p1Data = await generateWithFallback(genAI, p1Prompt, YEARLY_REPORT_SCHEMA);

          // Align months for P1
          if (p1Data.monthly_forecasts) {
            p1Data.monthly_forecasts = p1Data.monthly_forecasts.slice(0, 6);
            p1Data.monthly_forecasts.forEach((m: any, i: number) => { m.month = p1Months[i]; });
          }

          currentReport = { ...p1Data, p1Complete: true };
          reportStore[type] = currentReport;
          await supabaseAdmin.from("orders").update({ report_content: reportStore }).eq("order_id", orderId);
        }

        // Phase 2: Last 6 Months
        if (currentReport.p1Complete && !currentReport.p2Complete) {
          await setProgress("正在推算行星軌跡，撰寫《年度專書》下半年...");
          console.log(`[Yearly] Generating Phase 2 (Months 7-12) for ${orderId}`);
          
          // 🌟 Dynamic Transit Injection for Phase 2
          const p2Events = p2Months.map(m => {
            const events = TRANSIT_DATA[m] || [];
            return `【${m} 真實星象】：${events.length > 0 ? events.join("；") : "穩定運行中"}`;
          }).join("\n");

          const p2Prompt = `你是一位資深占星家。延續《年度專書》，撰寫《年度專書：下半年》。
【核心星盤依據】：${chartInfo}
【當月真實天文事件參考】：
${p2Events}

【要求】：
1. 後 6 個月(${p2Months.join(", ")})的詳細流年運勢。
   - 每個月的「details」字數必須達到 500 字以上。
   - 【關鍵指令】：必須結合上方提供的「真實天文事件」進行解析。
   - 禁止虛構日期。內容必須細分：事業發展、感情桃花、財富運勢與身心健康。
【指令】：禁止提供通用建議。必須嚴格計算流年行星與上述本命數據的相位與宮位影響。
`;

          // Phase 2 only needs the monthly_forecasts array
          const P2_SCHEMA = {
            type: SchemaType.OBJECT,
            properties: {
              monthly_forecasts: {
                type: SchemaType.ARRAY,
                items: YEARLY_REPORT_SCHEMA.properties.monthly_forecasts.items
              }
            },
            required: ["monthly_forecasts"]
          };

          const p2Data = await generateWithFallback(genAI, p2Prompt, P2_SCHEMA);

          // Align months for P2
          if (p2Data.monthly_forecasts) {
            const forecasts = p2Data.monthly_forecasts.slice(0, 6);
            forecasts.forEach((m: any, i: number) => { m.month = p2Months[i]; });

            // Merge P2 into P1
            currentReport.monthly_forecasts = [...(currentReport.monthly_forecasts || []), ...forecasts];
            currentReport.p2Complete = true;
            currentReport.isComplete = true;
          }
        }

        reportStore[type] = currentReport;
        await setProgress(`《年度專書》12 個月分析已完成...`);
        await supabaseAdmin.from("orders").update({ report_content: reportStore }).eq("order_id", orderId);
      } else {
        // Default Generation for simpler report types
        const data = await generateWithFallback(genAI, prompt, schema);
        currentReport = { ...data, isComplete: true };
        reportStore[type] = currentReport;
        await setProgress(`已成功顯化《${currentReport.title}》內容...`);
        await supabaseAdmin.from("orders").update({ report_content: reportStore }).eq("order_id", orderId);
      }

      // --- SYNC TO MONGODB (Professional Storage Snapshot) ---
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
              { orderId: orderId },
              {
                $set: {
                  input: birthInfo,
                  results: order.chart_data,
                  [`reports.${mongoKey}`]: { content: currentReport, generatedAt: new Date(), isPaid: true }
                }
              },
              { upsert: true }
            );
            console.log(`[Sync] Successfully synced ${type} (as '${mongoKey}') for Order ${orderId} to MongoDB`);
          }
        } catch (syncErr) {
          console.error(`[Sync] Error syncing ${type} to MongoDB:`, syncErr);
        }
      }
    }

    // Final safety sweep
    for (const type of productTypes) {
      if (reportStore[type]) {
        reportStore[type].isComplete = true;
      }
    }

    // Final clean up: remove progress and RELEASE LOCK
    delete reportStore._progress;
    delete reportStore._lock; 

    await supabaseAdmin.from("orders").update({ 
      report_content: reportStore,
      updated_at: new Date().toISOString()
    }).eq("order_id", orderId);

    // 🌟 4. SEND EMAIL NOTIFICATION
    try {
      const resend = new Resend(process.env.RESEND_API_KEY);
      const reportLink = `${process.env.NEXT_PUBLIC_BASE_URL}/report/${orderId}`;
      
      console.log(`[Mail] Attempting to send report email to ${order.email}...`);
      
      await resend.emails.send({
        from: `${process.env.RESEND_FROM_NAME} <${process.env.RESEND_FROM_EMAIL}>`,
        to: order.email,
        subject: `✨ 靈魂訊息已顯化：${customerName}，您的 AI 占星報告已撰寫完成`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; background-color: #050508; color: #ffffff; padding: 40px; border-radius: 20px;">
            <h2 style="color: #a855f7; text-align: center;">您的星空啟示錄已準備就緒</h2>
            <p>親愛的 ${customerName}：</p>
            <p>我是您的 AI 占星師。在過去的這段時間裡，我已經深度掃描了您的出生星盤，並將宇宙的低語轉化為詳盡的文字。</p>
            <p>您購買的報告（包含年度、愛情、事業與靈魂全書）現在已經完整顯化，等待您的閱讀。</p>
            <div style="text-align: center; margin: 40px 0;">
              <a href="${reportLink}" style="background-color: #9333ea; color: white; padding: 16px 32px; text-decoration: none; border-radius: 12px; font-weight: bold; display: inline-block;">點此開啟您的靈魂全書</a>
            </div>
            <p style="color: #94a3b8; font-size: 12px; text-align: center;">
              如果您無法點擊按鈕，請複製此連結到瀏覽器：<br>
              ${reportLink}
            </p>
            <hr style="border: none; border-top: 1px solid #1e293b; margin: 30px 0;">
            <p style="font-size: 14px; text-align: center; color: #64748b;">Aistrology AI 占星團隊 敬上</p>
          </div>
        `
      });
      console.log(`[Mail] ✅ Report email SENT successfully to ${order.email}`);
    } catch (mailErr) {
      console.error(`[Mail] ❌ Failed to send email:`, mailErr);
    }

    console.log(`[FullDepth] ✅ All reports finalized and lock released for ${orderId}`);

  } catch (err) {
    console.error("Critical Generation Error:", err);
    // Release the lock
    try {
      const pastDate = new Date(Date.now() - 10 * 60 * 1000).toISOString();
      await supabaseAdmin.from("orders").update({ 
        report_content: { ...reportStore, _lock: pastDate, _error: String(err) } 
      }).eq("order_id", orderId);
    } catch (unlockErr) {
      console.error("Failed to release lock:", unlockErr);
    }
  }
}
