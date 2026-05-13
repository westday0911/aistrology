import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { generateAndEmailReport } from "@/lib/report-generator";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params;

    // 1. Fetch order
    const { data: order, error } = await supabaseAdmin
      .from("orders")
      .select("*")
      .eq("order_id", orderId)
      .single();

    if (error || !order) return NextResponse.json({ error: "找不到該訂單" }, { status: 404 });
    
    if (order.status !== "SUCCESS") {
      return NextResponse.json({ error: "訂單尚未付款成功", status: order.status }, { status: 403 });
    }

    let reportContent = order.report_content || {};
    
    // 2. Try to augment with MongoDB content (Professional Storage)
    try {
      const dbConnect = (await import("@/lib/db")).default;
      const Chart = (await import("@/models/Chart")).default;
      await dbConnect();
      
      const birthInfo = order.birth_data || order.chart_data.input || order.chart_data;
      const mongoChart = await Chart.findOne({
        "input.birthDate": birthInfo.birthDate,
        "input.birthTime": birthInfo.birthTime,
        "input.location": birthInfo.location
      });

      if (mongoChart && mongoChart.reports) {
        // Merge MongoDB reports into reportContent
        Object.entries(mongoChart.reports).forEach(([type, data]: [string, any]) => {
          if (data.isPaid && data.content && !reportContent[type]?.isComplete) {
            reportContent[type] = data.content;
          }
        });
      }
    } catch (mongoErr) {
      console.error("MongoDB Read Error (fallback to Supabase):", mongoErr);
    }

    // 3. Determine ALL expected report types
    let expectedTypes = order.product_type.includes(",") 
      ? order.product_type.split(",").map((t: string) => t.trim())
      : [order.product_type];

    if (expectedTypes.includes("bundle")) {
      ["yearly", "love", "career"].forEach(t => {
        if (!expectedTypes.includes(t)) expectedTypes.push(t);
      });
    }

    // 4. Check completion
    const incompleteTypes = expectedTypes.filter((type: string) => !reportContent[type]?.isComplete);
    const isAllComplete = incompleteTypes.length === 0;

    if (!isAllComplete) {
      const isAnyStarted = Object.keys(reportContent).length > 0;
      if (!isAnyStarted) {
        generateAndEmailReport(orderId).catch(console.error);
      }

      return NextResponse.json({ 
        status: "GENERATING",
        message: `AI 正在撰寫中 (尚餘 ${incompleteTypes.length} 個章節)，請稍候...`
      });
    }

    // 5. Everything is ready
    return NextResponse.json({
      status: "READY",
      report_content: reportContent,
      product_type: order.product_type
    });

  } catch (error: any) {
    console.error("Report API Error:", error);
    return NextResponse.json({ error: "系統忙碌中" }, { status: 500 });
  }
}