import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params;

    // 1. Fetch order from Supabase
    const { data: order, error } = await supabaseAdmin
      .from("orders")
      .select("*")
      .eq("order_id", orderId)
      .single();

    if (error || !order) {
      return NextResponse.json({ error: "找不到該訂單" }, { status: 404 });
    }

    if (order.status !== "SUCCESS") {
      return NextResponse.json({ error: "訂單尚未付款成功" }, { status: 403 });
    }

    // 2. If report doesn't exist, call Gemini AI
    if (!order.report_content) {
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
      const modelName = process.env.GEMINI_MODEL || "gemini-1.5-flash-latest";
      const model = genAI.getGenerativeModel({ model: modelName });

      const chartInfo = JSON.stringify(order.chart_data);
      const userQuestions = order.questions?.join(", ") || "無特定問題";

      const prompt = `
        你是一位專業的古典與現代占星師，擅長從靈魂層面解析生命藍圖。
        
        【客戶資料】
        - 產品類型: ${order.product_type}
        - 星盤數據: ${chartInfo}
        - 靈魂提問: ${userQuestions}
        
        【生成要求】
        1. 請根據星盤中的行星落位、宮位與相位，撰寫一份深度的占星報告。
        2. 語言請使用「繁體中文」，語氣要專業、溫暖、具有啟發性。
        3. 必須針對客戶的「靈魂提問」給出明確的占星建議。
        4. 請以 JSON 格式輸出，格式如下：
        {
          "title": "報告標題",
          "summary": "一份大約 100 字的精簡總結",
          "sections": [
            { "title": "章節標題", "content": "詳細內容文字" }
          ]
        }
        5. JSON 內容不要包含 Markdown 格式的 \`\`\`json 標籤，直接輸出原始 JSON 字串。
      `;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      let text = response.text().trim();
      
      // Basic JSON cleaning if AI adds markers
      text = text.replace(/```json/g, "").replace(/```/g, "").trim();

      try {
        const reportContent = JSON.parse(text);
        
        // Save generated report back to DB
        await supabaseAdmin
          .from("orders")
          .update({ 
            report_content: reportContent,
            paid_at: order.paid_at || new Date().toISOString() 
          })
          .eq("order_id", orderId);
        
        order.report_content = reportContent;
      } catch (parseError) {
        console.error("AI JSON Parse Error:", text);
        throw new Error("AI 生成格式錯誤");
      }
    }

    return NextResponse.json(order);

  } catch (error: any) {
    console.error("Report API Error:", error);
    return NextResponse.json({ error: error.message || "系統錯誤" }, { status: 500 });
  }
}

    return NextResponse.json(order);

  } catch (error) {
    return NextResponse.json({ error: "系統錯誤" }, { status: 500 });
  }
}
