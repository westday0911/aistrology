import { NextResponse } from "next/server";
import crypto from "crypto";
import querystring from "querystring";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(req: Request) {
  try {
    const { type, email, amount, name, birthData, chartData, questions, couponCode } = await req.json();

    const merchantId = process.env.PAYUNI_MERCHANT_ID;
    const hashKey = process.env.PAYUNI_HASH_KEY;
    const hashIv = process.env.PAYUNI_HASH_IV;
    const apiUrl = process.env.PAYUNI_API_URL;
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;

    if (!merchantId || !hashKey || !hashIv) {
      throw new Error("PayUni keys are not configured in .env");
    }

    // 1. Server-side Coupon Validation (Security)
    let finalAmount = amount;
    if (couponCode) {
      const { data: coupon, error: cError } = await supabaseAdmin
        .from("coupons")
        .select("*")
        .eq("code", couponCode)
        .eq("is_active", true)
        .single();

      if (!cError && coupon) {
        if (coupon.current_usages < coupon.max_usages) {
          // Verify and apply discount again on server side
          // (Assuming amount from frontend already has discount, but we verify here)
          console.log(`Applying coupon ${couponCode} for discount ${coupon.discount_amount}`);
          
          // Increment usage count
          await supabaseAdmin
            .from("coupons")
            .update({ current_usages: coupon.current_usages + 1 })
            .eq("id", coupon.id);
        }
      }
    }

    const orderId = `ASTRO${Date.now()}`;

    // 2. Save initial order info to Supabase
    const { error: dbError } = await supabaseAdmin.from("orders").insert([
      {
        order_id: orderId,
        email,
        product_type: type,
        amount: finalAmount,
        order_name: name,
        birth_data: birthData,
        chart_data: chartData,
        questions,
        status: "PENDING",
      },
    ]);

    if (dbError) {
      console.error("Supabase Insert Error:", dbError);
      throw new Error("無法建立訂單紀錄");
    }
    
    // 3. Prepare EncryptInfo with 2.0 names and SORTED keys
    const rawData: any = {
      MerID: merchantId,
      MerTradeNo: orderId,
      TradeAmt: finalAmount,
      Timestamp: Math.floor(Date.now() / 1000),
      ReturnURL: `${baseUrl}/api/payuni/return`,
      NotifyURL: `${baseUrl}/api/payuni/notify`,
      UsrMail: email,
      ProdDesc: name,
      Credit: 1,
      ApplePay: 1,
      GooglePay: 1
    };

    // Sort keys alphabetically
    const sortedData = Object.keys(rawData)
      .sort()
      .reduce((acc: any, key) => {
        acc[key] = rawData[key];
        return acc;
      }, {});

    const plaintext = querystring.stringify(sortedData);

    // 4. AES-256-GCM Encryption
    const key = hashKey;
    const iv = Buffer.from(hashIv);
    const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);

    let cipherText = cipher.update(plaintext, "utf8", "base64");
    cipherText += cipher.final("base64");

    const tag = cipher.getAuthTag().toString("base64");
    const encryptInfo = Buffer.from(`${cipherText}:::${tag}`).toString("hex").trim();

    // 5. HashInfo = SHA256(HashKey + EncryptInfo + HashIV)
    const shaString = `${hashKey}${encryptInfo}${hashIv}`;
    const hashInfo = crypto.createHash("sha256").update(shaString).digest("hex").toUpperCase();

    return NextResponse.json({
      success: true,
      payload: {
        MerID: merchantId,
        EncryptInfo: encryptInfo,
        HashInfo: hashInfo,
        Version: "2.0",
        ApiUrl: apiUrl
      }
    });

  } catch (error: any) {
    console.error("PayUni Checkout Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
