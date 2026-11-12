import safetyRulesJson from "../../../packages/safety-rules/safety_rules.json";
import impactFactorsJson from "../../../packages/safety-rules/impact_factors.json";

export type SafetyDecision = "APPROVE" | "APPROVE_WITH_WARNING" | "BLOCK";
export type StorageMethod = "ambient" | "chilled";
export type PackagingType = "sealed_containers" | "covered_trays" | "open_unsealed";

export interface SafetyRuleCategory {
  label: string;
  max_hours_ambient: number;
  max_hours_chilled: number;
  warning_buffer_minutes: number;
  blocked: boolean;
  requires_sealed_for_chilled: boolean;
  notes: string;
}

export const SAFETY_RULES = safetyRulesJson as {
  _notice: string;
  version: string;
  categories: Record<string, SafetyRuleCategory>;
  packaging_multipliers: Record<PackagingType, number>;
  minimum_remaining_minutes_to_approve: number;
};

export const IMPACT_FACTORS = impactFactorsJson as {
  _notice: string;
  version: string;
  default_kg_per_portion: number;
  default_inr_per_meal: number;
  categories: Record<
    string,
    { kg_per_portion: number; co2e_kg_per_kg_food: number; inr_per_portion: number }
  >;
};

export function redactPii(text: string): string {
  if (!text) return text;
  const emailRegex = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g;
  const phoneRegex = /(?:\+?\d{1,3}[\s-]?)?(?:\(?\d{3,5}\)?[\s-]?)?\d{3,5}[\s-]?\d{4,5}/g;
  const addrRegex =
    /\b\d{1,4}[A-Za-z]?(?:[/,-]\d{1,4})?\s+[A-Za-z0-9\s]{2,40}?\b(?:Road|Rd|Street|St|Marg|Avenue|Ave|Lane|Ln|Nagar|Society|Flat|Floor|Apt|Block|Sector)\b/gi;
  return text
    .replace(emailRegex, "[REDACTED_EMAIL]")
    .replace(phoneRegex, "[REDACTED_PHONE]")
    .replace(addrRegex, "[REDACTED_ADDRESS]");
}

export interface SafetyEvalResult {
  decision: SafetyDecision;
  safe_by: string;
  remaining_minutes: number;
  explanation: string;
  rule_notes: string;
  is_sample_rule: true;
}

export function evaluateSafetyLocal(params: {
  category: string;
  prepared_at: string;
  storage_method: StorageMethod;
  packaging: PackagingType;
  now?: Date;
}): SafetyEvalResult {
  const now = params.now ?? new Date();
  const preparedAt = new Date(params.prepared_at);
  const catRule = SAFETY_RULES.categories[params.category];

  if (!catRule) {
    return {
      decision: "BLOCK",
      safe_by: now.toISOString(),
      remaining_minutes: 0,
      explanation: `Category '${params.category}' is not in the approved safety rules table.`,
      rule_notes: "Unknown category blocked by default.",
      is_sample_rule: true,
    };
  }

  if (catRule.blocked) {
    return {
      decision: "BLOCK",
      safe_by: preparedAt.toISOString(),
      remaining_minutes: 0,
      explanation: catRule.notes,
      rule_notes: catRule.notes,
      is_sample_rule: true,
    };
  }

  if (Number.isNaN(preparedAt.getTime()) || preparedAt.getTime() > now.getTime() + 5 * 60000) {
    return {
      decision: "BLOCK",
      safe_by: now.toISOString(),
      remaining_minutes: 0,
      explanation: "Prepared time cannot be in the future. Please verify when the food was cooked.",
      rule_notes: catRule.notes,
      is_sample_rule: true,
    };
  }

  const baseHours =
    params.storage_method === "chilled" ? catRule.max_hours_chilled : catRule.max_hours_ambient;
  const multiplier = SAFETY_RULES.packaging_multipliers[params.packaging] ?? 1.0;

  const effectiveHours =
    params.storage_method === "chilled" &&
    catRule.requires_sealed_for_chilled &&
    params.packaging === "open_unsealed"
      ? catRule.max_hours_ambient * multiplier
      : baseHours * multiplier;

  const safeByMs = preparedAt.getTime() + effectiveHours * 3600 * 1000;
  const safeByIso = new Date(safeByMs).toISOString();
  const remainingMinutes = Math.floor((safeByMs - now.getTime()) / 60000);

  if (remainingMinutes <= 0) {
    return {
      decision: "BLOCK",
      safe_by: safeByIso,
      remaining_minutes: 0,
      explanation: `This item has passed its ${effectiveHours.toFixed(1)}h safety window. ${catRule.notes}`,
      rule_notes: catRule.notes,
      is_sample_rule: true,
    };
  }

  if (remainingMinutes < SAFETY_RULES.minimum_remaining_minutes_to_approve) {
    return {
      decision: "BLOCK",
      safe_by: safeByIso,
      remaining_minutes: remainingMinutes,
      explanation: `Only ${remainingMinutes} minutes remain before safe-by expiry (minimum ${SAFETY_RULES.minimum_remaining_minutes_to_approve} min required).`,
      rule_notes: catRule.notes,
      is_sample_rule: true,
    };
  }

  if (remainingMinutes <= catRule.warning_buffer_minutes || params.packaging === "open_unsealed") {
    return {
      decision: "APPROVE_WITH_WARNING",
      safe_by: safeByIso,
      remaining_minutes: remainingMinutes,
      explanation: `Approved with urgency: ${remainingMinutes} minutes left to deliver. ${catRule.notes}`,
      rule_notes: catRule.notes,
      is_sample_rule: true,
    };
  }

  return {
    decision: "APPROVE",
    safe_by: safeByIso,
    remaining_minutes: remainingMinutes,
    explanation: `Safe to rescue for ${remainingMinutes} more minutes. ${catRule.notes}`,
    rule_notes: catRule.notes,
    is_sample_rule: true,
  };
}

export function calculateImpactLocal(category: string, portions: number) {
  const cat = IMPACT_FACTORS.categories[category];
  const kgPerPortion = cat?.kg_per_portion ?? IMPACT_FACTORS.default_kg_per_portion;
  const co2PerKg = cat?.co2e_kg_per_kg_food ?? 2.0;
  const inrPerPortion = cat?.inr_per_portion ?? IMPACT_FACTORS.default_inr_per_meal;

  const kg = Number((portions * kgPerPortion).toFixed(2));
  const co2e_kg = Number((kg * co2PerKg).toFixed(2));
  const value_inr = Number((portions * inrPerPortion).toFixed(2));
  return { meals: portions, kg, co2e_kg, value_inr };
}

