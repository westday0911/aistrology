import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import dbConnect from "@/lib/db";
import Chart from "@/models/Chart";

export async function POST(req: Request) {
  try {
    const { chartId, type, birthData, chartData } = await req.json();

    if (!type || !process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: "Invalid request or missing API Key" }, { status: 400 });
    }

    await dbConnect();

    // 1. Check if we already have this report cached
    let query = {};
    if (chartId) {
      query = { _id: chartId };
    } else {
      query = {
        "input.birthDate": birthData.birthDate,
        "input.birthTime": birthData.birthTime,
        "input.location": birthData.location
      };
    }

    const existingChart = await Chart.findOne(query);

    if (existingChart && existingChart.reports?.[type]?.content) {
      console.log(`Found cached ${type} report in MongoDB`);
      return NextResponse.json({
        success: true,
        type,
        content: existingChart.reports[type].content,
        cached: true
      });
    }

    // 2. Not cached? Let's generate it with Gemini
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ 
      model: process.env.GEMINI_MODEL || "gemini-1.5-flash" 
    });

    const prompt = getPromptByType(type, chartData, birthData);
    
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: { maxOutputTokens: 8192, temperature: 0.8 }
    });

    const response = await result.response;
    let text = response.text().trim();

    // Clean JSON if needed
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) text = jsonMatch[0];

    try {
      const reportContent = JSON.parse(text);

      // 3. Save/Update to MongoDB
      if (existingChart) {
        existingChart.reports[type] = {
          content: reportContent,
          generatedAt: new Date(),
          isPaid: true
        };
        await existingChart.save();
      } else {
        // Create new record if for some reason it didn't exist
        await Chart.create({
          input: birthData,
          results: chartData,
          reports: {
            [type]: {
              content: reportContent,
              generatedAt: new Date(),
              isPaid: true
            }
          }
        });
      }

      return NextResponse.json({
        success: true,
        type,
        content: reportContent,
        cached: false
      });

    } catch (parseErr) {
      console.error("Report JSON Parse Error:", text);
      return NextResponse.json({ error: "AI 格式解析錯誤，請重試" }, { status: 500 });
    }

  } catch (error: any) {
    console.error("Generate Report Error:", error);
    return NextResponse.json({ error: "系統連線異常" }, { status: 500 });
  }
}

function getPromptByType(type: string, chartData: any, birthData: any) {
  const baseInfo = `使用者數據: ${JSON.stringify(birthData)} \n星盤數據: ${JSON.stringify(chartData)}`;
  
  const prompts: Record<string, string> = {
    yearly: `
      你是一位專精「流年預測」的現代占星師。請根據以下數據，撰寫一份「2024-2025 年度運勢專書」。
      ${baseInfo}
      要求：包含 12 個月的月度運勢曲線描述、重要流年相位、以及針對事業、財富、愛情的具體建議。
      格式：請以 JSON 輸出，包含 "summary", "monthlyForecast" (Array), "majorTransits" (Array)。
    `,
    love: `
      你是一位專精「心理占星與親密關係」的大師。請根據以下數據，撰寫一份「靈魂愛情報告」。
      ${baseInfo}
      要求：深度解析本命盤中的金星、火星與第七宮。預測未來一年的桃花機緣，並給出避開感情地雷的精準建議。
      格式：請以 JSON 輸出，包含 "coreArchetype", "relationshipNeeds", "futureOutlook", "advice"。
    `,
    career: `
      你是一位專精「職業占星與財富能量」的導師。請根據以下數據，撰寫一份「事業財富地圖」。
      ${baseInfo}
      要求：解析使用者的事業天賦、適合的產業、金錢能量狀態、以及未來三年的職涯轉折點。
      格式：請以 JSON 輸出，包含 "talents", "wealthEnergy", "careerTimeline", "recommendations"。
    `,
    full: `
      你是一位頂級的「靈魂占星全書」作者。請根據以下數據與用戶提問，撰寫一份萬字級別的「靈魂全書」。
      ${baseInfo}
      要求：這是一份最深度的全盤解析。請整合所有行星相位、宮位主星、南北交點靈魂使命。並針對用戶的所有提問給出極致詳盡的解答。
      格式：請以 JSON 輸出，包含 "soulMission", "fullChartAnalysis", "qAndA", "conclusion"。
    `
  };

  return `${prompts[type] || prompts.full} \n請使用繁體中文，語氣溫暖且極具權威感。確保輸出是純 JSON。`;
}
