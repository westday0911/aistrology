import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { generateAndEmailReport } from "@/lib/report-generator";

// Normalize legacy / non-standard report structures from MongoDB into the format the frontend expects
function normalizeReportContent(content: any): any {
  if (!content) return content;

  // Handle yearly_astrology_report nested format
  if (content.yearly_astrology_report) {
    const r = content.yearly_astrology_report;
    const sections: any[] = [];
    if (r.natal_chart_foundation) sections.push({ title: r.natal_chart_foundation.section_title || "星盤基礎", content: r.natal_chart_foundation.description || JSON.stringify(r.natal_chart_foundation) });
    if (r.yearly_astrological_transits) sections.push({ title: r.yearly_astrological_transits.section_title || "年度星象流年", content: r.yearly_astrological_transits.description || JSON.stringify(r.yearly_astrological_transits) });
    if (r.key_periods_advice) sections.push({ title: r.key_periods_advice.section_title || "關鍵時期與建議", content: Object.values(r.key_periods_advice).filter(v => typeof v === 'string').join('\n\n') });
    if (r.conclusion) sections.push({ title: "年度總結", content: typeof r.conclusion === 'string' ? r.conclusion : JSON.stringify(r.conclusion) });
    return { title: r.title || "年度占星報告", intro: r.introduction || "", sections, isComplete: content.isComplete };
  }

  // Handle careerReport nested format
  if (content.careerReport) {
    const r = content.careerReport;
    const sections: any[] = [];
    
    Object.entries(r).forEach(([k, v]: [string, any]) => {
      if (k === 'title' || k === 'introduction' || k === 'conclusion') return;
      if (typeof v === 'object' && v !== null) {
        sections.push({ title: v.sectionTitle || k, content: v.content || JSON.stringify(v) });
      } else if (typeof v === 'string') {
        sections.push({ title: k, content: v });
      }
    });
    
    if (r.conclusion) {
      sections.push({ title: "事業地圖總結", content: r.conclusion });
    }
    
    return { 
      title: r.title || "事業財富地圖", 
      intro: r.introduction || "", 
      sections, 
      isComplete: content.isComplete 
    };
  }

  // Handle other legacy field names (like love report having reportTitle instead of title)
  const normalized = { ...content };
  if (normalized.reportTitle && !normalized.title) {
    normalized.title = normalized.reportTitle;
  }
  if (normalized.report_title && !normalized.title) {
    normalized.title = normalized.report_title;
  }
  if (normalized.introduction && !normalized.intro) {
    normalized.intro = normalized.introduction;
  }

  // Fallback: If no sections array exists but there are other textual properties, convert them to sections
  // This happens when Gemini ignores the schema and outputs flat keys like { conclusion: "...", key_themes: [...] }
  if (!normalized.sections || !Array.isArray(normalized.sections) || normalized.sections.length === 0) {
    // Only apply this to single reports, not bundle (bundle has monthly_forecasts, etc.)
    if (!normalized.monthly_forecasts && !normalized.yearly_theme) {
      const sections: any[] = [];
      
      const keyTranslations: Record<string, string> = {
        conclusion: "總結與建議",
        key_themes: "核心主題",
        yearly_guidance: "年度指引",
        detailed_analysis: "深度解析",
        natal_chart_summary: "星盤基礎總覽",
        synthesized_outlook: "綜合展望",
        core_vocational_talents: "核心天賦",
        optimal_career_paths: "最佳事業發展",
        financial_management: "財務與資源管理",
        challenges_and_growth: "挑戰與成長"
      };

      Object.entries(normalized).forEach(([k, v]) => {
        if (['title', 'intro', 'reportTitle', 'report_title', 'introduction', 'isComplete', 'sections'].includes(k)) return;
        
        let formattedTitle = keyTranslations[k.toLowerCase()];
        if (!formattedTitle) {
          formattedTitle = k.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        }

        if (typeof v === 'string') {
          sections.push({ title: formattedTitle, content: v });
        } else if (Array.isArray(v)) {
          sections.push({ title: formattedTitle, content: v.join('\n\n') });
        }
      });
      normalized.sections = sections;
    }
  }

  return normalized;
}

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
        orderId: orderId
      });

      if (mongoChart && mongoChart.reports) {
        const mongoKeyMap: Record<string, string> = { full: "bundle" };
        Object.entries(mongoChart.reports).forEach(([mongoKey, data]: [string, any]) => {
          const reportKey = mongoKeyMap[mongoKey] || mongoKey;
          if (data?.isPaid && data?.content) {
            // Restore and FORCE isComplete to true so API knows it's ready
            console.log(`[Sync] Restoring '${mongoKey}' from MongoDB as '${reportKey}'`);
            const normalized = normalizeReportContent(data.content);
            reportContent[reportKey] = { ...normalized, isComplete: true };
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



    // 4. Determine if we can show partial results
    const incompleteTypes = expectedTypes.filter((t: string) => !reportContent[t]?.isComplete);
    const isComplete = incompleteTypes.length === 0;

    // Ensure all currently available report contents are normalized
    const currentResults: Record<string, any> = {};
    for (const key of Object.keys(reportContent)) {
      if (key.startsWith('_')) continue; // Skip internal flags
      currentResults[key] = normalizeReportContent(reportContent[key]);
    }

    if (!isComplete) {
      // ATOMIC LOCK: Try to update ONLY IF it's older than 5 minutes
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      
      const { data, error: lockError } = await supabaseAdmin
        .from("orders")
        .update({ report_content: { ...reportContent, _lock: new Date().toISOString() } })
        .eq("order_id", orderId)
        .or(`report_content->>_lock.lt.${fiveMinutesAgo},report_content->>_lock.is.null`)
        .select('*');

      if (lockError || !data || data.length === 0) {
        // If locked, we still want to show what's already done!
        return NextResponse.json({ 
          status: "PARTIAL_READY", 
          report_content: currentResults,
          user_info: {
            name: order.customer_name || order.birth_data?.customer_name || "星盤主人",
            birth_data: order.birth_data
          },
          message: `AI 正在撰寫其餘部分...`
        });
      }

      console.log(`[Lock] Atomic Lock SEIZED for ${orderId}. Starting generation.`);
      generateAndEmailReport(orderId).catch(console.error);

      return NextResponse.json({ 
        status: "PARTIAL_READY", 
        report_content: currentResults,
        user_info: {
          name: order.customer_name || "尊貴的星友",
          birth_data: order.birth_data
        },
        message: `AI 撰寫引擎已成功啟動，請先閱讀已完成的部分...`
      });
    }

    // 5. Everything is completely ready
    return NextResponse.json({
      status: "READY",
      report_content: currentResults,
      product_type: order.product_type,
      user_info: {
        name: order.customer_name || order.birth_data?.customer_name || "星盤主人",
        birth_data: order.birth_data
      }
    });

  } catch (error: any) {
    console.error("Report API Error:", error);
    return NextResponse.json({ error: "系統忙碌中" }, { status: 500 });
  }
}