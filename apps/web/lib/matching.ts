export interface ReceiverOrg {
  id: string;
  orgName: string;
  area: string;
  lat: number;
  lon: number;
  dailyDemandPortions: number;
  rescuedTodayPortions: number;
  maxSinglePickupPortions: number;
  dietaryPreference: "any" | "veg_only";
  isOpenNow: boolean;
  hoursSinceLastRescue: number;
  verified: boolean;
}

export interface RankedReceiver {
  receiverId: string;
  orgName: string;
  area: string;
  rank: number;
  score: number;
  distanceKm: number;
  estimatedTravelMinutes: number;
  reasons: string[];
}

export function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const r = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return 2 * r * Math.asin(Math.sqrt(a));
}

export function rankReceiversLocal(params: {
  listingLat: number;
  listingLon: number;
  portions: number;
  veg: boolean;
  safeByIso: string;
  maxRadiusKm: number;
  receivers: ReceiverOrg[];
  declinedIds?: string[];
}): {
  matches: RankedReceiver[];
  splitSuggestion: {
    primaryOrg: string;
    primaryPortions: number;
    secondaryOrg: string;
    secondaryPortions: number;
  } | null;
} {
  const remainingMinutes = (new Date(params.safeByIso).getTime() - Date.now()) / 60000;
  const declined = new Set(params.declinedIds ?? []);

  const scored: Omit<RankedReceiver, "rank">[] = [];
  for (const r of params.receivers) {
    if (!r.verified || !r.isOpenNow || declined.has(r.id)) continue;
    if (r.dietaryPreference === "veg_only" && !params.veg) continue;

    const distKm = haversineKm(params.listingLat, params.listingLon, r.lat, r.lon);
    if (distKm > params.maxRadiusKm) continue;

    const travelMin = (distKm / 22) * 60 + 5;
    if (travelMin > remainingMinutes - 15) continue;

    const proximity = Math.max(0, 1 - distKm / params.maxRadiusKm);
    const unmetNeed = Math.max(0, r.dailyDemandPortions - r.rescuedTodayPortions);
    const need = Math.min(1, unmetNeed / Math.max(1, params.portions));
    const capacityFit = Math.min(1, r.maxSinglePickupPortions / params.portions);
    const dietaryFit = 1;
    const availability = r.isOpenNow ? 1 : 0;
    const fairness = Math.min(1, r.hoursSinceLastRescue / 24);

    const score = Number(
      (
        0.3 * proximity +
        0.2 * need +
        0.15 * capacityFit +
        0.15 * dietaryFit +
        0.1 * availability +
        0.1 * fairness
      ).toFixed(4)
    );

    scored.push({
      receiverId: r.id,
      orgName: r.orgName,
      area: r.area,
      score,
      distanceKm: Number(distKm.toFixed(2)),
      estimatedTravelMinutes: Math.round(travelMin),
      reasons: [
        `${distKm.toFixed(1)} km away (~${Math.round(travelMin)} min)`,
        `Unmet need: ${unmetNeed} portions`,
        `Capacity: ${r.maxSinglePickupPortions} portions`,
        `Fairness: ${r.hoursSinceLastRescue}h since last rescue`,
      ],
    });
  }

  scored.sort((a, b) => b.score - a.score);
  const matches: RankedReceiver[] = scored.map((m, idx) => ({ ...m, rank: idx + 1 }));

  let splitSuggestion: {
    primaryOrg: string;
    primaryPortions: number;
    secondaryOrg: string;
    secondaryPortions: number;
  } | null = null;

  if (matches.length >= 2) {
    const firstOrg = params.receivers.find((x) => x.id === matches[0].receiverId);
    const secondOrg = params.receivers.find((x) => x.id === matches[1].receiverId);
    if (firstOrg && secondOrg && firstOrg.maxSinglePickupPortions < params.portions) {
      const p1 = firstOrg.maxSinglePickupPortions;
      const p2 = Math.min(params.portions - p1, secondOrg.maxSinglePickupPortions);
      if (p2 > 0) {
        splitSuggestion = {
          primaryOrg: firstOrg.orgName,
          primaryPortions: p1,
          secondaryOrg: secondOrg.orgName,
          secondaryPortions: p2,
        };
      }
    }
  }

  return { matches, splitSuggestion };
}

