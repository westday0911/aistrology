import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(req: Request) {
  try {
    const { code } = await req.json();

    if (!code) return NextResponse.json({ error: "請輸入優惠碼" }, { status: 400 });

    // Fetch coupon from Supabase
    const { data: coupon, error } = await supabaseAdmin
      .from("coupons")
      .select("*")
      .eq("code", code.trim().toUpperCase())
      .eq("is_active", true)
      .single();

    if (error || !coupon) {
      return NextResponse.json({ error: "優惠碼無效或已過期" }, { status: 404 });
    }

    // Check usage limit
    if (coupon.current_usages >= coupon.max_usages) {
      return NextResponse.json({ error: "此優惠碼已被使用完畢" }, { status: 400 });
    }

    // Check expiry
    if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
      return NextResponse.json({ error: "優惠碼已過期" }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      discount_amount: coupon.discount_amount,
      code: coupon.code
    });

  } catch (error) {
    console.error("Coupon Validation Error:", error);
    return NextResponse.json({ error: "系統錯誤" }, { status: 500 });
  }
}
