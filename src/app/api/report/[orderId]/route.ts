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

    const reportContent = order.report_content || {};
    
    // 2. Determine ALL expected report types (including sub-reports for bundle)
    let expectedTypes = order.product_type.includes(",") 
      ? order.product_type.split(",").map((t: string) => t.trim())
      : [order.product_type];

    if (expectedTypes.includes("bundle")) {
      // For bundle, we expect 'bundle' itself PLUS the 3 detailed reports
      ["yearly", "love", "career"].forEach(t => {
        if (!expectedTypes.includes(t)) expectedTypes.push(t);
      });
    }

    // 3. Check if EVERY single expected part is complete
    const incompleteTypes = expectedTypes.filter((type: string) => !reportContent[type]?.isComplete);
    const isAllComplete = incompleteTypes.length === 0;

    if (!isAllComplete) {
      // Trigger generation ONLY IF it hasn't started at all
      const isAnyStarted = Object.keys(reportContent).length > 0;
      if (!isAnyStarted) {
        console.log(`Initial trigger for ${orderId}`);
        generateAndEmailReport(orderId).catch(console.error);
      }

      return NextResponse.json({ 
        status: "GENERATING",
        message: `AI 正在撰寫中 (尚餘 ${incompleteTypes.length} 個章節)，請稍候...`
      });
    }

    // 4. Everything is ready
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