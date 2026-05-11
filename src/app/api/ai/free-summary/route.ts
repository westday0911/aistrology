import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(req: Request) {
  try {
    const { chartData } = await req.json();

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: "API Key not configured" }, { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const modelName = process.env.GEMINI_MODEL || "gemini-1.5-flash-latest";
    const model = genAI.getGenerativeModel({ model: modelName });

    const prompt = `
      你是一位頂尖的現代占星師，擅長結合心理占星與靈魂占星。請根據以下星盤數據，撰寫一份極致深度的「靈魂藍圖解析」。
      
      【星盤數據】: ${JSON.stringify(chartData)}
      
      【生成要求】:
      1. 語氣：溫暖、精確、具有啟發性、高品質的文字風格（類似高端精品品牌的敘事方式）。
      2. 語言：繁體中文。
      3. 內容長度：每個行星與宮位的解說請控制在 150-250 字之間，要比一般的示範內容更具深度。
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
          "2": "第二宮解析...",
          ... (以此類推到 12)
        }
      }
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text().trim();

    // Clean JSON string
    text = text.replace(/```json/g, "").replace(/```/g, "").trim();

    try {
      const fullAnalysis = JSON.parse(text);
      return NextResponse.json(fullAnalysis);
    } catch (e) {
      console.error("JSON Parse Error:", text);
      return NextResponse.json({ error: "AI 生成格式錯誤" }, { status: 500 });
    }
  } catch (error: any) {
    console.error("Free Interpretation Error:", error);
    return NextResponse.json({ error: "AI 暫時休息中" }, { status: 500 });
  }
}
