import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { calculateImpactLocal, evaluateSafetyLocal } from "@/lib/safety";

const CreateListingSchema = z.object({
  title: z.string().min(2).max(120),
  category: z.string().min(2),
  items: z.array(z.string()).default([]),
  veg: z.boolean().default(true),
  portions: z.number().int().positive().max(5000),
  allergens: z.array(z.string()).default([]),
  packaging: z.enum(["sealed_containers", "covered_trays", "open_unsealed"]),
  storage_method: z.enum(["ambient", "chilled"]).default("ambient"),
  prepared_at: z.string(),
  pickup_area: z.string().min(2),
  pickup_address_exact: z.string().min(3),
  donor_safety_confirmed: z.literal(true),
});

export async function POST(req: NextRequest) {
  try {
    const json = await req.json();
    const parsed = CreateListingSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", issues: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const d = parsed.data;
    const fastapiUrl = process.env.FASTAPI_URL || "http://127.0.0.1:8000";

    let safetyResult = evaluateSafetyLocal({
      category: d.category,
      prepared_at: d.prepared_at,
      storage_method: d.storage_method,
      packaging: d.packaging,
    });

    try {
      const upstream = await fetch(`${fastapiUrl}/safety/evaluate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: d.category,
          prepared_at: d.prepared_at,
          storage_method: d.storage_method,
          packaging: d.packaging,
        }),
        signal: AbortSignal.timeout(8000),
      });
      if (upstream.ok) {
        safetyResult = await upstream.json();
      }
    } catch {
      // Deterministic local rules engine matches FastAPI identically
    }

    const impact = calculateImpactLocal(d.category, d.portions);

    if (safetyResult.decision === "BLOCK") {
      return NextResponse.json(
        {
          blocked: true,
          safety: safetyResult,
          message:
            "Listing blocked by Food Safety Rules Engine. Only an admin can review blocked items.",
        },
        { status: 422 }
      );
    }

    return NextResponse.json(
      {
        blocked: false,
        listing: {
          id: `lst-${Date.now()}`,
          ...d,
          kg: impact.kg,
          safe_by: safetyResult.safe_by,
          safety_decision: safetyResult.decision,
          safety_explanation: safetyResult.explanation,
          status: "open",
          created_at: new Date().toISOString(),
        },
        safety: safetyResult,
        impact_preview: impact,
      },
      { status: 201 }
    );
  } catch {
    return NextResponse.json({ error: "Failed to create listing" }, { status: 500 });
  }
}

