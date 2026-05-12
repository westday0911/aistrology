import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import crypto from "crypto";
import { generateAndEmailReport } from "@/lib/report-generator";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const status = formData.get("Status");
    const encryptInfo = formData.get("EncryptInfo") as string;
    const hashInfo = formData.get("HashInfo");

    const hashKey = process.env.PAYUNI_HASH_KEY!;
    const hashIv = process.env.PAYUNI_HASH_IV!;

    if (status === "SUCCESS" && encryptInfo) {
      // 1. Decrypt PayUni Data
      const encryptedData = Buffer.from(encryptInfo, "hex").toString();
      const [cipherText, tag] = encryptedData.split(":::");
      
      const decipher = crypto.createDecipheriv("aes-256-gcm", hashKey, Buffer.from(hashIv));
      decipher.setAuthTag(Buffer.from(tag, "base64"));
      
      let decrypted = decipher.update(cipherText, "base64", "utf8");
      decrypted += decipher.final("utf8");
      
      const result = JSON.parse(decrypted);
      const orderId = result.MerTradeNo;

      console.log(`Payment success for order: ${orderId}`);

      // 2. Update Order Status in Supabase
      const { data: order, error: updateError } = await supabaseAdmin
        .from("orders")
        .update({ 
          status: "SUCCESS",
          paid_at: new Date().toISOString()
        })
        .eq("order_id", orderId)
        .select()
        .single();

      if (updateError) throw updateError;

      // 3. Trigger Report Generation & Email (Background)
      // Note: We don't 'await' here because generation takes 60s+ 
      // and we need to respond to PayUni quickly.
      generateAndEmailReport(orderId).catch(e => console.error("Background gen failed:", e));

      return new Response("1|OK", { status: 200 }); // PayUni expects 1|OK
    }

    return new Response("0|FAIL", { status: 400 });

  } catch (error: any) {
    console.error("PayUni Notify Error:", error);
    return new Response("0|FAIL", { status: 500 });
  }
}
