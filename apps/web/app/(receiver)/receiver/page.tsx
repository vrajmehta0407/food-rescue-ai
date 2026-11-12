"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, Flag, MapPin, Sparkles, XCircle } from "lucide-react";
import { SafeByRing } from "@/components/glass/SafeByRing";
import { RescueMap, type MapMarkerPoint } from "@/components/map/RescueMap";
import { rankReceiversLocal } from "@/lib/matching";
import { useAppStore } from "@/lib/store";

export default function ReceiverFeedPage() {
  const { listings, receivers, acceptMatch, declineMatch, flagListing } = useAppStore();
  const [selectedReceiverId, setSelectedReceiverId] = useState(receivers[0]?.id ?? "ngo-asha");
  const [toast, setToast] = useState<string | null>(null);
  const [vegFilter, setVegFilter] = useState(false);

  const activeReceiver =
    receivers.find((r) => r.id === selectedReceiverId) ?? receivers[0];

  const feedListings = useMemo(() => {
    return listings
      .filter((l) => l.status === "open" || l.status === "matched")
      .filter((l) => (vegFilter ? l.veg : true));
  }, [listings, vegFilter]);

  const mapPoints = useMemo<MapMarkerPoint[]>(() => {
    const pts: MapMarkerPoint[] = feedListings.map((l) => ({
      id: l.id,
      label: l.title,
      sublabel: `${l.portions} portions • ${l.pickupArea}`,
      lat: l.lat,
      lon: l.lon,
      kind: "donor",
    }));
    if (activeReceiver) {
      pts.push({
        id: activeReceiver.id,
        label: activeReceiver.orgName,
        sublabel: "Your Kitchen / Shelter",
        lat: activeReceiver.lat,
        lon: activeReceiver.lon,
        kind: "receiver",
      });
    }
    return pts;
  }, [feedListings, activeReceiver]);

  const handleDecline = (listingId: string) => {
    const res = declineMatch(listingId, selectedReceiverId);
    if (res.declines >= 3) {
      setToast(
        `Declined (${res.declines}x). Match radius automatically widened to ${res.widenedToKm} km!`
      );
    } else {
      setToast(`Declined. Auto-escalating to next ranked NGO (${res.declines}/3 declines).`);
    }
  };

  return (
    <div className="space-y-8">
      <section className="glass flex flex-wrap items-center justify-between gap-4 p-7">
        <div className="space-y-1.5">
          <span className="glass-teal inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold text-teal-700">
            <Sparkles className="h-3.5 w-3.5 text-berry" aria-hidden="true" />
            Smart Matching • Receiver Feed + Map
          </span>
          <h1 className="font-display text-3xl font-bold text-ink">
            Available Surplus Nearby
          </h1>
          <p className="text-sm text-ink/75">
            Exact donor addresses stay hidden until you accept a match.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <label className="text-xs font-bold text-ink" htmlFor="receiver-select">
            Acting as NGO:
          </label>
          <select
            id="receiver-select"
            value={selectedReceiverId}
            onChange={(e) => setSelectedReceiverId(e.target.value)}
            className="min-h-[46px] rounded-full border border-ink/15 bg-white px-4 text-xs font-bold text-ink"
          >
            {receivers.map((r) => (
              <option key={r.id} value={r.id}>
                {r.orgName} ({r.area})
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => setVegFilter((v) => !v)}
            className={`min-h-[46px] rounded-full px-4 text-xs font-bold ${
              vegFilter ? "bg-teal text-white" : "bg-white/80 text-ink"
            }`}
          >
            {vegFilter ? "Veg Only: ON" : "All Food"}
          </button>
        </div>
      </section>

      {toast && (
        <div role="status" className="glass-tangerine flex items-center justify-between p-4 text-sm font-semibold text-ink">
          <span>{toast}</span>
          <button
            type="button"
            onClick={() => setToast(null)}
            className="rounded-full bg-white/80 px-3 py-1 text-xs font-bold"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Map Peek */}
      <section className="glass p-5">
        <RescueMap points={mapPoints} heightClass="h-64" />
      </section>

      {/* Pinterest Masonry Grid */}
      <section className="columns-1 gap-5 space-y-5 sm:columns-2 lg:columns-4">
        {feedListings.map((listing) => {
          const ranking = rankReceiversLocal({
            listingLat: listing.lat,
            listingLon: listing.lon,
            portions: listing.portions,
            veg: listing.veg,
            safeByIso: listing.safeBy,
            maxRadiusKm: listing.matchRadiusKm,
            receivers,
            declinedIds: listing.declinedReceiverIds,
          });
          const myMatch = ranking.matches.find((m) => m.receiverId === selectedReceiverId);
          const isMatchedToMe =
            listing.status === "matched" && listing.acceptedReceiverId === selectedReceiverId;

          return (
            <article
              key={listing.id}
              className="glass mb-5 break-inside-avoid overflow-hidden p-5"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span
                    className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase ${
                      listing.status === "matched"
                        ? "border border-teal text-teal-700 bg-teal-50"
                        : "bg-tangerine text-white"
                    }`}
                  >
                    {listing.status === "matched" ? "Matched" : "Available"}
                  </span>
                  <h2 className="mt-2 font-display text-lg font-bold text-ink">
                    {listing.title}
                  </h2>
                  <p className="text-xs font-medium text-ink/70">{listing.donorName}</p>
                </div>
                <SafeByRing safeByIso={listing.safeBy} size={68}>
                  <div className="flex h-full w-full items-center justify-center bg-white/90 text-[11px] font-bold text-ink">
                    {listing.veg ? "VEG" : "NON"}
                  </div>
                </SafeByRing>
              </div>

              {listing.photoDataUrl && (
                <img
                  src={listing.photoDataUrl}
                  alt={listing.title}
                  className="mt-3 h-36 w-full rounded-[20px] object-cover"
                />
              )}

              <div className="mt-3 space-y-2 text-xs text-ink/80">
                <p className="tabular-nums font-bold text-ink">
                  {listing.portions} portions ({listing.kg} kg) • Radius {listing.matchRadiusKm} km
                </p>
                <p className="flex items-start gap-1.5">
                  <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-tangerine" aria-hidden="true" />
                  <span>
                    {isMatchedToMe
                      ? listing.pickupAddressExact
                      : `${listing.pickupArea} (Exact address unlocks on Accept)`}
                  </span>
                </p>

                {myMatch && (
                  <div className="glass-teal rounded-2xl p-3">
                    <p className="tabular-nums font-bold text-teal-700">
                      Match Rank #{myMatch.rank} • Score {(myMatch.score * 100).toFixed(0)}%
                    </p>
                    <ul className="mt-1 space-y-0.5 text-[11px] text-ink/75">
                      {myMatch.reasons.map((r) => (
                        <li key={r}>• {r}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {ranking.splitSuggestion && (
                  <div className="glass-tangerine rounded-2xl p-3 text-[11px] font-semibold text-ink">
                    <AlertTriangle className="mr-1 inline h-3.5 w-3.5 text-tangerine" aria-hidden="true" />
                    Split suggestion: {ranking.splitSuggestion.primaryPortions} portions to{" "}
                    {ranking.splitSuggestion.primaryOrg} +{" "}
                    {ranking.splitSuggestion.secondaryPortions} to{" "}
                    {ranking.splitSuggestion.secondaryOrg}
                  </div>
                )}
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {listing.status === "open" ? (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        acceptMatch(listing.id, selectedReceiverId);
                        setToast(
                          `Accepted '${listing.title}'! Exact pickup address unlocked & volunteer assigned.`
                        );
                      }}
                      className="inline-flex min-h-[48px] flex-1 items-center justify-center gap-1.5 rounded-full bg-tangerine px-4 text-xs font-bold text-white shadow-sm hover:bg-tangerine-700"
                    >
                      <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                      <span>Accept</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDecline(listing.id)}
                      className="inline-flex min-h-[48px] items-center justify-center gap-1 rounded-full bg-white/80 px-4 text-xs font-bold text-ink hover:bg-white"
                    >
                      <XCircle className="h-4 w-4 text-tangerine" aria-hidden="true" />
                      <span>Decline</span>
                    </button>
                  </>
                ) : (
                  <span className="inline-flex min-h-[44px] w-full items-center justify-center rounded-full bg-teal/15 px-3 text-xs font-bold text-teal-700">
                    Matched to {listing.acceptedReceiverName}
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => {
                    flagListing(listing.id, "Receiver flagged food quality or mismatch");
                    setToast("Flag submitted to Trust & Moderation review.");
                  }}
                  aria-label={`Flag ${listing.title}`}
                  className="inline-flex min-h-[44px] items-center gap-1 rounded-full px-3 text-[11px] font-semibold text-ink/60 hover:bg-tangerine/10 hover:text-tangerine-700"
                >
                  <Flag className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Flag</span>
                </button>
              </div>
            </article>
          );
        })}
      </section>
    </div>
  );
}
