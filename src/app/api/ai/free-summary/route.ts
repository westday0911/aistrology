import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import dbConnect from "@/lib/db";
import Chart from "@/models/Chart";

export async function POST(req: Request) {
  try {
    const { chartData, inputData } = await req.json();

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: "API Key not configured" }, { status: 500 });
    }

    // Connect to Database
    await dbConnect();

    // 1. CHECK FOR CACHED DATA FIRST
    const existingChart = await Chart.findOne({
      "input.birthDate": inputData.birthDate,
      "input.birthTime": inputData.birthTime,
      "input.location": inputData.location,
      orderId: { $exists: false }
    }).sort({ createdAt: -1 });

    if (existingChart && existingChart.aiAnalysis?.summary) {
      console.log("Found cached interpretation in MongoDB, returning immediately.");
      return NextResponse.json({
        summary: existingChart.aiAnalysis.summary,
        planets: existingChart.aiAnalysis.planets,
        houses: existingChart.aiAnalysis.houses
      });
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    
    // Fallback Logic: Try Primary then Backup
    const modelsToTry = [
      process.env.GEMINI_MODEL || "gemini-1.5-flash",
      process.env.GEMINI_MODEL_BACKUP || "gemini-1.5-pro"
    ];

    let lastError = null;
    let text = "";

    for (const modelName of modelsToTry) {
      try {
        console.log(`Attempting generation with: ${modelName}`);
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent({
          contents: [{ role: "user", parts: [{ text: getPrompt(chartData) }] }],
          generationConfig: { 
            responseMimeType: "application/json",
            maxOutputTokens: 8192, 
            temperature: 0.7 
          }
        });
        const response = await result.response;
        text = response.text().trim();
        
        if (text && text.includes("{")) break; // Success!
      } catch (err: any) {
        console.error(`Error with model ${modelName}:`, err.message);
        lastError = err;
      }
    }

    if (!text) {
      return NextResponse.json({ error: "AI 服務暫時忙碌中，請稍後再試", details: lastError?.message }, { status: 503 });
    }

    // Advanced JSON cleaning
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      text = jsonMatch[0];
    }

    try {
      const fullAnalysis = JSON.parse(text);

      // ASYNC SAVE TO MONGODB (Don't wait for it if you want speed, but here we wait for consistency)
      try {
        await Chart.create({
          input: inputData,
          results: chartData,
          aiAnalysis: {
            summary: fullAnalysis.summary,
            planets: fullAnalysis.planets,
            houses: fullAnalysis.houses
          }
        });
        console.log("Successfully cached chart and analysis to MongoDB");
      } catch (dbErr) {
        console.error("MongoDB Save Error (non-blocking):", dbErr);
      }

      return NextResponse.json(fullAnalysis);
    } catch (e) {
      console.error("JSON Parse Error. Raw text:", text);
      return NextResponse.json({ error: "解析格式微調中，請再點擊一次生成" }, { status: 500 });
    }
  } catch (error: any) {
    console.error("Free Interpretation Error:", error);
    return NextResponse.json({ error: "系統連線異常" }, { status: 500 });
  }
}

function getPrompt(chartData: any) {
  return `
      你是一位頂尖的現代占星師，擅長結合心理占星與靈魂占星。請根據以下星盤數據，撰寫一份極致深度的「靈魂藍圖解析」。
      
      【星盤數據】: ${JSON.stringify(chartData)}
      
      【生成要求】:
      1. 語氣：溫暖、精確、具有啟發性、高品質的文字風格（類似高端精品品牌的敘事方式）。
      2. 語言：繁體中文。
      3. 內容長度：
         - 「planets」部分：請保持精簡（約 50-80 字），重點說明該行星對靈魂的核心影響即可。
         - 「houses」部分：請進行深度展開（約 200-300 字），從心理占星的角度詳細分析該宮位所代表的人生領域與挑戰。
      4. 格式：請務必以 JSON 格式輸出，且不得包含 Markdown 標籤。格式如下：
      {
        "summary": "整體靈魂摘要文字",
        "planets": {
          "太陽": "詳細解析...",
          "月亮": "詳細解析...",
          "水星": "詳細解析...",
          "金星": "詳細解析...",
          "火星": "詳細解析...",
          "木星": "詳細解析...",
          "土星": "詳細解析...",
          "天王星": "詳細解析...",
          "海王星": "詳細解析...",
          "冥王星": "詳細解析..."
        },
        "houses": {
          "1": "第一宮解析...",
          ... (以此類推到 12)
        }
      }
    `;
}
