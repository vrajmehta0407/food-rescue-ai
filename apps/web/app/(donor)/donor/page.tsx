"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2, PlusCircle, RefreshCw, ShieldCheck, WifiOff } from "lucide-react";
import { SafeByRing } from "@/components/glass/SafeByRing";
import { useAppStore } from "@/lib/store";

export default function DonorHomePage() {
  const { profile, listings, offlineQueue, flushOfflineQueue } = useAppStore();
  const [syncNotice, setSyncNotice] = useState("");

  useEffect(() => {
    const handleOnline = () => {
      const count = flushOfflineQueue();
      if (count > 0) {
        setSyncNotice(`Synced ${count} offline listing(s) automatically.`);
      }
    };
    window.addEventListener("online", handleOnline);
    return () => window.removeEventListener("online", handleOnline);
  }, [flushOfflineQueue]);

  const totalMeals = listings.reduce((acc, l) => acc + l.portions, 0);

  return (
    <div className="space-y-8">
      <section className="glass flex flex-wrap items-center justify-between gap-6 p-7">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="glass-teal inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold text-teal-700">
              <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
              {profile?.verificationStatus === "approved"
                ? "Verified Donor"
                : `Verification: ${profile?.verificationStatus ?? "unsubmitted"}`}
            </span>
            <span className="tabular-nums rounded-full bg-white/80 px-3 py-1 text-xs font-bold text-ink">
              Trust {profile?.trustScore?.toFixed(1) ?? "5.0"} ★
            </span>
          </div>
          <h1 className="font-display text-3xl font-bold text-ink">
            {profile?.orgName || "Donor Hub"}
          </h1>
          <p className="text-sm text-ink/75">
            Post surplus food in under 45 seconds. Deterministic rules calculate{" "}
            <code className="rounded bg-white/70 px-1.5 py-0.5 text-xs">safe_by</code> before
            matching begins.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {offlineQueue.length > 0 && (
            <button
              type="button"
              onClick={() => {
                const count = flushOfflineQueue();
                setSyncNotice(`Synced ${count} queued listing(s).`);
              }}
              className="glass-tangerine inline-flex min-h-[48px] items-center gap-2 rounded-full px-4 py-2 text-xs font-bold text-ink"
            >
              <WifiOff className="h-4 w-4 text-tangerine" aria-hidden="true" />
              <span>{offlineQueue.length} offline queued</span>
              <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          )}
          <Link
            href="/donor/new"
            className="inline-flex min-h-[52px] items-center gap-2 rounded-full bg-tangerine px-6 py-3 text-sm font-bold text-white shadow-lg shadow-tangerine/25 hover:bg-tangerine-700"
          >
            <PlusCircle className="h-5 w-5" aria-hidden="true" />
            <span>Rescue Food</span>
          </Link>
        </div>
      </section>

      {syncNotice && (
        <div className="glass-teal flex items-center gap-2 p-4 text-sm font-semibold text-teal-700">
          <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
          <span>{syncNotice}</span>
        </div>
      )}

      <section className="grid gap-4 sm:grid-cols-3">
        <div className="glass p-5">
          <p className="text-xs font-bold uppercase tracking-wider text-ink/60">Active & Rescued</p>
          <p className="tabular-nums mt-1 font-display text-3xl font-bold text-ink">
            {listings.length} listings
          </p>
        </div>
        <div className="glass p-5">
          <p className="text-xs font-bold uppercase tracking-wider text-ink/60">Total Portions</p>
          <p className="tabular-nums mt-1 font-display text-3xl font-bold text-teal-700">
            {totalMeals} meals
          </p>
        </div>
        <div className="glass p-5">
          <p className="text-xs font-bold uppercase tracking-wider text-ink/60">Safety Rule Table</p>
          <p className="mt-1 text-sm font-semibold text-ink">
            Sample v1.0 <span className="text-xs font-normal text-ink/65">(verify before use)</span>
          </p>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="font-display text-2xl font-bold text-ink">Your Surplus Listings</h2>
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {listings.map((item) => (
            <article key={item.id} className="glass flex flex-col justify-between p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-bold uppercase ${
                      item.safetyDecision === "BLOCK"
                        ? "bg-tangerine text-white"
                        : item.safetyDecision === "APPROVE_WITH_WARNING"
                        ? "glass-tangerine text-ink"
                        : "bg-teal text-white"
                    }`}
                  >
                    {item.safetyDecision === "APPROVE_WITH_WARNING" && (
                      <AlertTriangle className="h-3 w-3" aria-hidden="true" />
                    )}
                    {item.status}
                  </span>
                  <h3 className="pt-1 font-display text-lg font-bold text-ink">{item.title}</h3>
                  <p className="text-xs text-ink/70">{item.pickupArea}</p>
                </div>

                <SafeByRing safeByIso={item.safeBy} size={70}>
                  <div className="flex h-full w-full items-center justify-center bg-white/90 text-xs font-bold text-ink">
                    {item.veg ? "VEG" : "NON"}
                  </div>
                </SafeByRing>
              </div>

              <div className="mt-4 space-y-2 border-t border-ink/10 pt-3 text-xs">
                <div className="flex items-center justify-between font-semibold text-ink">
                  <span className="tabular-nums">
                    {item.portions} portions ({item.kg} kg)
                  </span>
                  <span className="capitalize text-ink/70">
                    {item.storageMethod} • {item.packaging.replace("_", " ")}
                  </span>
                </div>
                <p className="text-ink/75">{item.safetyExplanation}</p>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

