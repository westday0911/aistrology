import { NextResponse } from "next/server";
import crypto from "crypto";
import querystring from "querystring";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const encryptInfo = formData.get("EncryptInfo") as string;
    const hashInfo = formData.get("HashInfo") as string;

    const hashKey = process.env.PAYUNI_HASH_KEY!;
    const hashIv = process.env.PAYUNI_HASH_IV!;
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL!;

    if (!encryptInfo || !hashInfo) {
      return NextResponse.redirect(`${baseUrl}/checkout?error=missing_data`, 303);
    }

    // 1. Verify HashInfo
    const shaString = `${hashKey}${encryptInfo}${hashIv}`;
    const calculatedHash = crypto.createHash("sha256").update(shaString).digest("hex").toUpperCase();

    if (calculatedHash !== hashInfo) {
      console.error("PayUni Return: Hash mismatch");
      return NextResponse.redirect(`${baseUrl}/checkout?error=hash_mismatch`, 303);
    }

    // 2. AES-GCM Decrypt
    // PayUni format: ciphertext:::tag in hex
    const combinedBuffer = Buffer.from(encryptInfo, "hex");
    const combinedString = combinedBuffer.toString();
    const [cipherText, tag] = combinedString.split(":::");

    const decipher = crypto.createDecipheriv("aes-256-gcm", hashKey, Buffer.from(hashIv));
    decipher.setAuthTag(Buffer.from(tag, "base64"));
    
    let decrypted = decipher.update(cipherText, "base64", "utf8");
    decrypted += decipher.final("utf8");

    // 3. Parse result (Query String format)
    const result = querystring.parse(decrypted);
    console.log("PayUni Payment Result:", result);

    // 4. Redirect based on status
    if (result.Status === "SUCCESS") {
      const orderId = result.MerTradeNo as string;

      // Update order status in Supabase
      const { error: dbError } = await supabaseAdmin
        .from("orders")
        .update({
          status: "SUCCESS",
          paid_at: new Date().toISOString(),
          pay_info: result, // Store full return info for audit
        })
        .eq("order_id", orderId);

      if (dbError) {
        console.error("Supabase Update Error:", dbError);
        // Even if DB fails, we still want to show success to user
        // but log it for manual intervention
      }

      return NextResponse.redirect(`${baseUrl}/checkout/success?orderNo=${orderId}`, 303);
    } else {
      return NextResponse.redirect(`${baseUrl}/checkout?error=payment_failed&msg=${result.Message}`, 303);
    }

  } catch (error) {
    console.error("PayUni Return Error:", error);
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL!;
    return NextResponse.redirect(`${baseUrl}/checkout?error=system_error`, 303);
  }
}
