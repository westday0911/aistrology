import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { generateAndEmailReport } from "@/lib/report-generator";
import dbConnect from "@/lib/db";
import Chart from "@/models/Chart";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params;

    // 1. Fetch order to get birth data for MongoDB cleanup
    const { data: order, error } = await supabaseAdmin
      .from("orders")
      .select("*")
      .eq("order_id", orderId)
      .single();

    if (error || !order) return NextResponse.json({ error: "找不到訂單" }, { status: 404 });

    // 2. Unlock the order so it can be resumed immediately
    // We do NOT clear report_content or MongoDB cache here.
    // The report-generator.ts will automatically skip any reports/phases that are already complete.
    const pastDate = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    await supabaseAdmin
      .from("orders")
      .update({ updated_at: pastDate })
      .eq("order_id", orderId);

    // 4. Trigger fresh generation
    // We don't await this as it takes a long time (runs in background)
    generateAndEmailReport(orderId).catch(console.error);

    return NextResponse.json({ success: true, message: "重新生成已啟動" });

  } catch (error: any) {
    console.error("Regenerate API Error:", error);
    return NextResponse.json({ error: "系統忙碌中" }, { status: 500 });
  }
}
