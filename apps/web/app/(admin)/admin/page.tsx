"use client";

import { CheckCircle2, Flag, ShieldAlert, ShieldCheck, XCircle } from "lucide-react";
import { useAppStore } from "@/lib/store";

export default function AdminConsolePage() {
  const {
    verifications,
    listings,
    flags,
    reviewVerification,
    resolveBlockedOrFlag,
  } = useAppStore();

  const blockedListings = listings.filter((l) => l.status === "blocked" || l.safetyDecision === "BLOCK");

  return (
    <div className="space-y-8">
      <section className="glass p-7">
        <span className="glass-tangerine inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold text-ink">
          <ShieldAlert className="h-4 w-4 text-tangerine" aria-hidden="true" />
          FR-10 • City Coordinator Admin Console
        </span>
        <h1 className="mt-2 font-display text-3xl font-bold text-ink">
          Partner Verification & Safety Review
        </h1>
        <p className="text-sm text-ink/75">
          AI never overrides a food-safety BLOCK or auto-bans an account. Only human city admins
          review escalated cases.
        </p>
      </section>

      {/* Pending Verifications */}
      <section className="glass space-y-4 p-6">
        <h2 className="flex items-center gap-2 font-display text-xl font-bold text-ink">
          <ShieldCheck className="h-5 w-5 text-teal-700" aria-hidden="true" />
          Partner Verification Queue ({verifications.length})
        </h2>
        <div className="grid gap-4 md:grid-cols-2">
          {verifications.map((v) => (
            <div key={v.id} className="rounded-[22px] bg-white/80 p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="rounded-full bg-teal-50 px-2.5 py-0.5 text-[11px] font-bold uppercase text-teal-700">
                    {v.role} • {v.docType}
                  </span>
                  <h3 className="mt-1.5 font-display text-lg font-bold text-ink">{v.orgName}</h3>
                  <p className="text-xs text-ink/70">
                    Contact: {v.profileName} • Doc: {v.docName}
                  </p>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-bold capitalize ${
                    v.status === "approved"
                      ? "bg-teal text-white"
                      : v.status === "rejected"
                      ? "bg-tangerine text-white"
                      : "bg-tangerine-100 text-tangerine-700"
                  }`}
                >
                  {v.status}
                </span>
              </div>

              {v.status === "pending" && (
                <div className="mt-4 flex gap-2">
                  <button
                    type="button"
                    onClick={() => reviewVerification(v.id, "approved")}
                    className="inline-flex min-h-[44px] flex-1 items-center justify-center gap-1.5 rounded-full bg-teal px-4 text-xs font-bold text-white hover:bg-teal-700"
                  >
                    <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                    Approve
                  </button>
                  <button
                    type="button"
                    onClick={() => reviewVerification(v.id, "rejected")}
                    className="inline-flex min-h-[44px] flex-1 items-center justify-center gap-1.5 rounded-full bg-tangerine-100 px-4 text-xs font-bold text-tangerine-700 hover:bg-tangerine hover:text-white"
                  >
                    <XCircle className="h-4 w-4" aria-hidden="true" />
                    Reject
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Blocked Listings & Moderation Flags */}
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="glass space-y-4 p-6">
          <h2 className="flex items-center gap-2 font-display text-xl font-bold text-ink">
            <ShieldAlert className="h-5 w-5 text-tangerine" aria-hidden="true" />
            Blocked Listings ({blockedListings.length})
          </h2>
          {blockedListings.length === 0 ? (
            <p className="text-sm text-ink/70">No blocked listings awaiting review.</p>
          ) : (
            blockedListings.map((l) => (
              <div key={l.id} className="rounded-[22px] bg-white/80 p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-ink">{l.title}</h3>
                  <span className="rounded-full bg-tangerine px-2.5 py-0.5 text-[11px] font-bold text-white">
                    BLOCKED
                  </span>
                </div>
                <p className="text-xs text-ink/75">{l.safetyExplanation}</p>
                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => resolveBlockedOrFlag(l.id, "listing", "approve")}
                    className="min-h-[42px] rounded-full bg-teal px-4 text-xs font-bold text-white hover:bg-teal-700"
                  >
                    Override with Warning
                  </button>
                  <button
                    type="button"
                    onClick={() => resolveBlockedOrFlag(l.id, "listing", "keep_blocked")}
                    className="min-h-[42px] rounded-full bg-white px-4 text-xs font-bold text-ink border border-ink/15"
                  >
                    Keep Blocked
                  </button>
                </div>
              </div>
            ))
          )}
        </section>

        <section className="glass space-y-4 p-6">
          <h2 className="flex items-center gap-2 font-display text-xl font-bold text-ink">
            <Flag className="h-5 w-5 text-berry" aria-hidden="true" />
            Trust & Moderation Flags ({flags.length})
          </h2>
          {flags.map((f) => (
            <div key={f.id} className="rounded-[22px] bg-white/80 p-4 space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-ink">{f.listingTitle}</h3>
                <span className="rounded-full bg-teal-50 px-2.5 py-0.5 text-[11px] font-bold uppercase text-teal-700">
                  {f.status}
                </span>
              </div>
              <p className="text-xs text-ink/75">
                Reported by {f.reporterRole}: {f.reason}
              </p>
              {f.status === "open" && (
                <button
                  type="button"
                  onClick={() => resolveBlockedOrFlag(f.id, "flag", "resolve")}
                  className="min-h-[42px] rounded-full bg-teal px-4 text-xs font-bold text-white hover:bg-teal-700"
                >
                  Mark Reviewed & Resolved
                </button>
              )}
            </div>
          ))}
        </section>
      </div>
    </div>
  );
}

