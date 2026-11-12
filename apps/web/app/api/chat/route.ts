import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { SAFETY_RULES, redactPii } from "@/lib/safety";

const ChatSchema = z.object({
  message: z.string().min(1).max(400),
  language: z.enum(["en", "hi", "gu"]).default("en"),
  task_summary: z.record(z.unknown()).optional().nullable(),
  impact_summary: z.record(z.unknown()).optional().nullable(),
});

export async function POST(req: NextRequest) {
  try {
    const json = await req.json();
    const parsed = ChatSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid chat query" }, { status: 400 });
    }

    const cleanMsg = redactPii(parsed.data.message);
    const fastapiUrl = process.env.FASTAPI_URL || "http://127.0.0.1:8000";

    try {
      const upstream = await fetch(`${fastapiUrl}/chat/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...parsed.data, message: cleanMsg }),
        signal: AbortSignal.timeout(8000),
      });
      if (upstream.ok) {
        return NextResponse.json(await upstream.json());
      }
    } catch {
      // Deterministic local fallback if FastAPI is offline
    }

    const q = cleanMsg.toLowerCase();
    const lang = parsed.data.language;

    if (q.includes("sweet") || q.includes("barfi") || q.includes("मिठाई") || q.includes("મીઠાઈ")) {
      const r = SAFETY_RULES.categories.dairy_sweets;
      const reply =
        lang === "hi"
          ? `${r.label}: कमरे के तापमान पर ${r.max_hours_ambient} घंटे और ठंडे में ${r.max_hours_chilled} घंटे सुरक्षित।`
          : lang === "gu"
          ? `${r.label}: રૂમ તાપમાને ${r.max_hours_ambient} કલાક અને ઠંડામાં ${r.max_hours_chilled} કલાક સુરક્ષિત.`
          : `${r.label}: max ${r.max_hours_ambient}h ambient or ${r.max_hours_chilled}h chilled. (Sample — review with a food-safety expert before real use)`;
      return NextResponse.json({ reply, tools_used: ["get_safety_rule"], language: lang });
    }

    if (q.includes("rice") || q.includes("biryani") || q.includes("બિરયાની")) {
      const r = SAFETY_RULES.categories.cooked_rice_dish;
      return NextResponse.json({
        reply: `${r.label}: max ${r.max_hours_ambient}h ambient or ${r.max_hours_chilled}h chilled.`,
        tools_used: ["get_safety_rule"],
        language: lang,
      });
    }

    if (q.includes("pickup") || q.includes("where") || q.includes("status") || q.includes("eta")) {
      const t = parsed.data.task_summary as { status?: string; eta_minutes?: number; area?: string } | null;
      return NextResponse.json({
        reply: t
          ? `Pickup status is '${t.status ?? "accepted"}' in ${t.area ?? "Ahmedabad"} (ETA ~${t.eta_minutes ?? 15} min).`
          : "No active pickup task selected yet. Open Volunteer or Receiver feed for live status.",
        tools_used: ["get_task_status"],
        language: lang,
      });
    }

    return NextResponse.json({
      reply:
        lang === "hi"
          ? "सत्यापित नियमों में यह जानकारी नहीं मिली। कृपया सिटी एडमिन से जांच करें।"
          : lang === "gu"
          ? "સુરક્ષા નિયમોમાં આ માહિતી નથી. કૃપા કરીને એડમિન સાથે તપાસો."
          : "I can answer from verified FoodRescue safety rules, pickup status, or impact stats. For anything else, please check with the city admin.",
      tools_used: [],
      language: lang,
    });
  } catch {
    return NextResponse.json({ error: "Chat error" }, { status: 500 });
  }
}

