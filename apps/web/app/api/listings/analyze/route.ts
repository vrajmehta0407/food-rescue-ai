import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { redactPii } from "@/lib/safety";

const AnalyzeSchema = z.object({
  image_base64: z.string().optional().nullable(),
  filename: z.string().optional().nullable(),
  voice_note: z.string().optional().nullable(),
});

export async function POST(req: NextRequest) {
  try {
    const json = await req.json();
    const parsed = AnalyzeSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request payload", issues: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const sanitizedVoiceNote = parsed.data.voice_note
      ? redactPii(parsed.data.voice_note)
      : null;

    const fastapiUrl = process.env.FASTAPI_URL || "http://127.0.0.1:8000";
    try {
      const upstream = await fetch(`${fastapiUrl}/vision/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image_base64: parsed.data.image_base64 ?? null,
          filename: parsed.data.filename ?? null,
          voice_note: sanitizedVoiceNote,
        }),
        signal: AbortSignal.timeout(20000),
      });
      if (upstream.ok) {
        const data = await upstream.json();
        return NextResponse.json(data);
      }
    } catch {
      // Fall back to deterministic mock response if FastAPI is not running locally
    }

    const hint = `${parsed.data.filename ?? ""} ${sanitizedVoiceNote ?? ""}`.toLowerCase();
    if (hint.includes("sweet") || hint.includes("barfi") || hint.includes("kheer")) {
      return NextResponse.json({
        category: "dairy_sweets",
        items: ["milk barfi", "gulab jamun"],
        veg: true,
        estimated_portions: 25,
        allergens: ["dairy", "tree_nuts"],
        packaging: "covered_trays",
        confidence: { category: 0.88, portions: 0.68 },
        low_confidence_fields: ["estimated_portions"],
        provider: "bff-fallback",
      });
    }
    if (hint.includes("roti") || hint.includes("naan") || hint.includes("bread")) {
      return NextResponse.json({
        category: "breads_rotis",
        items: ["tandoori roti", "naan"],
        veg: true,
        estimated_portions: 50,
        allergens: ["gluten"],
        packaging: "covered_trays",
        confidence: { category: 0.9, portions: 0.78 },
        low_confidence_fields: [],
        provider: "bff-fallback",
      });
    }

    return NextResponse.json({
      category: "cooked_rice_dish",
      items: ["veg biryani", "raita"],
      veg: true,
      estimated_portions: 40,
      allergens: ["dairy"],
      packaging: "sealed_containers",
      confidence: { category: 0.92, portions: 0.61 },
      low_confidence_fields: ["estimated_portions"],
      provider: "bff-fallback",
    });
  } catch {
    return NextResponse.json({ error: "Failed to analyze photo" }, { status: 500 });
  }
}

