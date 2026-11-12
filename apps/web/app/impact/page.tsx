"use client";

import { useMemo } from "react";
import { Award, Download, Heart, Leaf, Sparkles, Trophy } from "lucide-react";
import { useAppStore } from "@/lib/store";

export default function ImpactDashboardPage() {
  const { impactRecords, profile } = useAppStore();

  const totals = useMemo(() => {
    return impactRecords.reduce(
      (acc, r) => ({
        meals: acc.meals + r.meals,
        kg: Number((acc.kg + r.kg).toFixed(2)),
        co2eKg: Number((acc.co2eKg + r.co2eKg).toFixed(2)),
        valueInr: Number((acc.valueInr + r.valueInr).toFixed(2)),
      }),
      { meals: 0, kg: 0, co2eKg: 0, valueInr: 0 }
    );
  }, [impactRecords]);

  const leaderboard = useMemo(() => {
    const byDonor = new Map<string, { meals: number; kg: number }>();
    for (const r of impactRecords) {
      const prev = byDonor.get(r.donorName) ?? { meals: 0, kg: 0 };
      byDonor.set(r.donorName, {
        meals: prev.meals + r.meals,
        kg: Number((prev.kg + r.kg).toFixed(2)),
      });
    }
    return Array.from(byDonor.entries())
      .map(([donorName, stats]) => ({ donorName, ...stats }))
      .sort((a, b) => b.meals - a.meals);
  }, [impactRecords]);

  const downloadCertificate = () => {
    const html = `<!doctype html>
<html><head><meta charset="utf-8"><title>FoodRescue AI Impact Certificate</title>
<style>body{font-family:sans-serif;padding:48px;background:#EEFAF8;color:#0B2A2E;}
.card{background:#fff;border:3px solid #00B8A9;border-radius:24px;padding:40px;max-width:720px;margin:auto;}
h1{color:#FF5C1F;margin:0 0 8px;} .stat{font-size:28px;font-weight:700;color:#00B8A9;}</style>
</head><body><div class="card">
<h1>FoodRescue AI — CSR & Community Impact Certificate</h1>
<p>Issued to: <strong>${profile?.orgName || "Ahmedabad Rescue Partner"}</strong></p>
<p>City: Ahmedabad Pilot | Generated: ${new Date().toLocaleDateString()}</p>
<hr/>
<p class="stat">${totals.meals} Meals Rescued • ${totals.kg} kg Food Saved</p>
<p>CO2e Avoided: <strong>${totals.co2eKg} kg</strong> | Estimated Food Value: <strong>INR ${totals.valueInr.toLocaleString("en-IN")}</strong></p>
<p style="font-size:12px;color:#555;">Sample emission & INR meal value factors — verify before audit/production use. Note: v1 provides an impact report only (not a legal tax receipt).</p>
</div></body></html>`;

    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "foodrescue-impact-certificate.html";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-8">
      <section className="glass flex flex-wrap items-center justify-between gap-6 p-7">
        <div>
          <span className="glass-berry inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold text-ink">
            <Heart className="h-3.5 w-3.5 text-berry" aria-hidden="true" />
            F5 • Deterministic Impact Calculator
          </span>
          <h1 className="mt-2 font-display text-3xl font-bold text-ink">
            Rescued Meals & Climate Impact
          </h1>
          <p className="text-sm text-ink/75">
            Every figure comes directly from verified delivery records and fixed conversion
            factors (sample data — review before production use).
          </p>
        </div>

        <button
          type="button"
          onClick={downloadCertificate}
          className="inline-flex min-h-[50px] items-center gap-2 rounded-full bg-tangerine px-6 py-3 text-sm font-bold text-white shadow-md hover:bg-tangerine-700"
        >
          <Download className="h-4 w-4" aria-hidden="true" />
          <span>Download CSR Certificate</span>
        </button>
      </section>

      {/* Big Count-Up Metric Cards */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="glass p-6">
          <p className="text-xs font-bold uppercase text-ink/60">Meals Rescued</p>
          <p className="tabular-nums mt-2 font-display text-5xl font-extrabold text-tangerine">
            {totals.meals}
          </p>
        </div>
        <div className="glass p-6">
          <p className="text-xs font-bold uppercase text-ink/60">Food Saved</p>
          <p className="tabular-nums mt-2 font-display text-5xl font-extrabold text-teal-700">
            {totals.kg} <span className="text-xl">kg</span>
          </p>
        </div>
        <div className="glass p-6">
          <p className="text-xs font-bold uppercase text-ink/60">CO2e Avoided</p>
          <p className="tabular-nums mt-2 font-display text-5xl font-extrabold text-ink">
            {totals.co2eKg} <span className="text-xl">kg</span>
          </p>
        </div>
        <div className="glass p-6">
          <p className="text-xs font-bold uppercase text-ink/60">Meal Value (Sample)</p>
          <p className="tabular-nums mt-2 font-display text-4xl font-extrabold text-ink">
            ₹{totals.valueInr.toLocaleString("en-IN")}
          </p>
        </div>
      </section>

      {/* Impact Stickers */}
      <section className="glass p-6">
        <h2 className="flex items-center gap-2 font-display text-xl font-bold text-ink">
          <Sparkles className="h-5 w-5 text-berry" aria-hidden="true" />
          Community Impact Stickers
        </h2>
        <div className="mt-4 flex flex-wrap gap-3">
          {[
            { label: "100+ Meals Milestone", tone: "bg-berry text-white -rotate-2" },
            { label: "Zero Safety Incidents", tone: "bg-teal text-white rotate-1" },
            { label: "Fast Responder (<40m)", tone: "bg-tangerine text-white -rotate-1" },
            { label: "Ahmedabad Climate Saver", tone: "glass-teal text-teal-700 rotate-2" },
          ].map((b) => (
            <span
              key={b.label}
              className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold shadow-sm transition hover:scale-105 ${b.tone}`}
            >
              <Award className="h-4 w-4" aria-hidden="true" />
              {b.label}
            </span>
          ))}
        </div>
      </section>

      {/* Leaderboard + Accessible Table */}
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="glass p-6">
          <h2 className="flex items-center gap-2 font-display text-xl font-bold text-ink">
            <Trophy className="h-5 w-5 text-tangerine" aria-hidden="true" />
            Ahmedabad Donor Leaderboard (Opt-In)
          </h2>
          <div className="mt-4 space-y-3">
            {leaderboard.map((row, idx) => (
              <div
                key={row.donorName}
                className="flex items-center justify-between rounded-2xl bg-white/75 px-4 py-3 text-sm"
              >
                <span className="font-bold text-ink">
                  #{idx + 1} {row.donorName}
                </span>
                <span className="tabular-nums font-bold text-teal-700">
                  {row.meals} meals ({row.kg} kg)
                </span>
              </div>
            ))}
          </div>
        </section>

        <section className="glass p-6">
          <h2 className="flex items-center gap-2 font-display text-xl font-bold text-ink">
            <Leaf className="h-5 w-5 text-teal-700" aria-hidden="true" />
            Verified Rescue Ledger
          </h2>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-ink/10 text-ink/60">
                  <th className="py-2">Listing</th>
                  <th className="py-2">Receiver</th>
                  <th className="py-2 text-right">Meals</th>
                  <th className="py-2 text-right">CO2e</th>
                </tr>
              </thead>
              <tbody>
                {impactRecords.map((rec) => (
                  <tr key={rec.id} className="border-b border-ink/5">
                    <td className="py-2.5 font-semibold text-ink">{rec.title}</td>
                    <td className="py-2.5 text-ink/75">{rec.receiverName}</td>
                    <td className="tabular-nums py-2.5 text-right font-bold text-ink">
                      {rec.meals}
                    </td>
                    <td className="tabular-nums py-2.5 text-right font-bold text-teal-700">
                      {rec.co2eKg} kg
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}

