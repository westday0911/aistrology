import { NextResponse } from "next/server";
import crypto from "crypto";
import querystring from "querystring";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(req: Request) {
  try {
    const { type, email, amount, name, birthData, chartData, questions } = await req.json();

    const merchantId = process.env.PAYUNI_MERCHANT_ID;
    const hashKey = process.env.PAYUNI_HASH_KEY;
    const hashIv = process.env.PAYUNI_HASH_IV;
    const apiUrl = process.env.PAYUNI_API_URL;
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;

    if (!merchantId || !hashKey || !hashIv) {
      throw new Error("PayUni keys are not configured in .env");
    }

    const orderId = `ASTRO${Date.now()}`;

    // Save initial order info to Supabase
    const { error: dbError } = await supabaseAdmin.from("orders").insert([
      {
        order_id: orderId,
        email,
        product_type: type,
        amount,
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
    
    // 1. Prepare EncryptInfo with 2.0 names and SORTED keys
    const rawData: any = {
      MerID: merchantId,
      MerTradeNo: orderId, // 2.0 format
      TradeAmt: amount,    // 2.0 format
      Timestamp: Math.floor(Date.now() / 1000), // 2.0 format
      ReturnURL: `${baseUrl}/api/payuni/return`,
      NotifyURL: `${baseUrl}/api/payuni/notify`,
      UsrMail: email,      // 2.0 format
      ProdDesc: name,      // 2.0 format
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

    // 2. AES-256-GCM Encryption (Official Pattern)
    const key = hashKey;
    const iv = Buffer.from(hashIv);
    const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);

    let cipherText = cipher.update(plaintext, "utf8", "base64");
    cipherText += cipher.final("base64");

    const tag = cipher.getAuthTag().toString("base64");

    // EncryptInfo = ciphertext:::tag in hex
    const encryptInfo = Buffer.from(`${cipherText}:::${tag}`).toString("hex").trim();

    // 3. HashInfo = SHA256(HashKey + EncryptInfo + HashIV)
    const shaString = `${hashKey}${encryptInfo}${hashIv}`;
    const hashInfo = crypto.createHash("sha256").update(shaString).digest("hex").toUpperCase();

    return NextResponse.json({
      success: true,
      payload: {
        MerID: merchantId,
        EncryptInfo: encryptInfo, // 2.0 name
        HashInfo: hashInfo,       // 2.0 name
        Version: "2.0",           // 2.0 version
        ApiUrl: apiUrl
      }
    });

  } catch (error: any) {
    console.error("PayUni Checkout Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
