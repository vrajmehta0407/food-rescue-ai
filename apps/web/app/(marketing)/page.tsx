"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, CheckCircle2, Clock3, Leaf, ShieldAlert, Sparkles, Utensils } from "lucide-react";
import { SafeByRing } from "@/components/glass/SafeByRing";

const MARQUEE_ITEMS = [
  "Spice Hub saved 40 meals 12 min ago",
  "Utsav Banquet saved 65 meals 28 min ago",
  "Gokul Mithai saved 30 sweets boxes 41 min ago",
  "Aroma Canteen saved 52 meals 1 hr ago",
];

const SAMPLE_CARDS = [
  {
    id: "c1",
    title: "Veg Biryani & Boondi Raita",
    donor: "Spice Hub • Navrangpura",
    portions: 40,
    tag: "Veg • Sealed",
    safeMinutes: 95,
    status: "Available",
    accent: "tangerine",
    gradient: "from-tangerine/25 via-white/70 to-teal/20",
  },
  {
    id: "c2",
    title: "Dal Tadka & Tandoori Roti",
    donor: "Utsav Banquet • Satellite",
    portions: 65,
    tag: "Veg • Covered Trays",
    safeMinutes: 26,
    status: "Expiring soon",
    accent: "tangerine",
    gradient: "from-tangerine/30 via-white/70 to-berry/15",
  },
  {
    id: "c3",
    title: "Kaju Barfi & Milk Peda",
    donor: "Gokul Mithai • Bodakdev",
    portions: 30,
    tag: "Chilled • Verified",
    safeMinutes: 210,
    status: "Delivered",
    accent: "teal",
    gradient: "from-teal/25 via-white/70 to-teal/10",
  },
  {
    id: "c4",
    title: "Fresh Sandwich Platters",
    donor: "Campus Cafe • Vastrapur",
    portions: 24,
    tag: "Veg • Sealed",
    safeMinutes: 145,
    status: "Matched",
    accent: "teal",
    gradient: "from-teal/20 via-white/70 to-tangerine/15",
  },
];

const TAB_DETAILS = {
  donor: {
    heading: "Post surplus in under 45 seconds",
    points: [
      "Snap a food photo — AI pre-fills dish category, estimated portions, and allergens.",
      "Deterministic Food Safety Engine computes safe_by instantly (no AI guesswork).",
      "Download verified impact metrics & CSR-style certificates for every rescue.",
    ],
    ctaLabel: "Post Surplus Now",
    ctaHref: "/donor/new",
  },
  receiver: {
    heading: "Fair, fast matching for NGOs & shelters",
    points: [
      "Ranked by proximity, daily unmet need, capacity, dietary fit, and fairness.",
      "See live Safe-By Ring countdowns before accepting.",
      "Exact pickup address unlocks only after match acceptance.",
    ],
    ctaLabel: "Verify NGO Profile",
    ctaHref: "/onboarding",
  },
  volunteer: {
    heading: "One-tap pickup & delivery routes",
    points: [
      "Large 48px tap targets designed for riders on 4G.",
      "Nearby pickups within 2 km batched into a single route.",
      "Earn celebratory Impact Stickers after every confirmed drop-off.",
    ],
    ctaLabel: "Join as Volunteer",
    ctaHref: "/onboarding",
  },
};

export default function LandingPage() {
  const [mealsCount, setMealsCount] = useState(12480);
  const [activeTab, setActiveTab] = useState<"donor" | "receiver" | "volunteer">("donor");

  useEffect(() => {
    const start = 11900;
    const target = 12480;
    const duration = 1200;
    const t0 = performance.now();
    let raf = 0;

    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) {
      setMealsCount(target);
      return;
    }

    const step = (now: number) => {
      const p = Math.min(1, (now - t0) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setMealsCount(Math.round(start + (target - start) * eased));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, []);

  const currentTab = TAB_DETAILS[activeTab];

  return (
    <div className="space-y-20">
      {/* 1. Hero Section */}
      <section className="grid items-center gap-10 pt-4 lg:grid-cols-12">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55 }}
          className="space-y-6 lg:col-span-7"
        >
          <span className="glass-teal inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-teal-700">
            <Sparkles className="h-3.5 w-3.5 text-berry" aria-hidden="true" />
            Ahmedabad Pilot • Sample Live Preview
          </span>

          <h1 className="font-display text-5xl font-extrabold leading-[1.04] tracking-tight text-ink sm:text-6xl">
            Don&apos;t waste it. <span className="text-berry">Rescue</span> it.
          </h1>

          <p className="max-w-xl text-lg leading-relaxed text-ink/80">
            Good food deserves a plate, not a bin. FoodRescue AI connects surplus meals from
            kitchens and events to verified shelters in minutes—with deterministic food-safety
            rules protecting every bite.
          </p>

          <div className="flex flex-wrap items-center gap-4">
            <Link
              href="/donor/new"
              className="inline-flex min-h-[52px] items-center gap-2.5 rounded-full bg-tangerine px-7 py-3.5 text-base font-bold text-white shadow-lg shadow-tangerine/30 transition hover:-translate-y-0.5 hover:bg-tangerine-700"
            >
              <span>Rescue Food Now</span>
              <ArrowRight className="h-5 w-5" aria-hidden="true" />
            </Link>
            <Link
              href="/donor"
              className="glass inline-flex min-h-[52px] items-center gap-2 rounded-full px-6 py-3.5 text-base font-semibold text-ink transition hover:bg-white/80"
            >
              Open Donor Hub
            </Link>
          </div>
        </motion.div>

        {/* Plate Counter + Floating Glass Preview */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="lg:col-span-5"
        >
          <div className="glass relative overflow-hidden p-8">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-teal-700">
                  City Plate Counter (Sample)
                </p>
                <p className="tabular-nums mt-2 font-display text-6xl font-extrabold text-ink">
                  {mealsCount.toLocaleString("en-IN")}
                </p>
                <p className="mt-1 text-sm font-medium text-ink/75">
                  meals rescued across Ahmedabad
                </p>
              </div>
              <span className="glass-berry -rotate-6 rounded-full px-3 py-1 text-xs font-bold text-ink">
                0 safety incidents
              </span>
            </div>

            <div className="mt-7 grid grid-cols-3 gap-3">
              <div className="glass-teal rounded-2xl p-3.5 text-center">
                <p className="tabular-nums text-xl font-bold text-ink">4,368 kg</p>
                <p className="text-xs text-ink/70">Food Saved</p>
              </div>
              <div className="glass-teal rounded-2xl p-3.5 text-center">
                <p className="tabular-nums text-xl font-bold text-ink">10.9 t</p>
                <p className="text-xs text-ink/70">CO2e Avoided</p>
              </div>
              <div className="glass-tangerine rounded-2xl p-3.5 text-center">
                <p className="tabular-nums text-xl font-bold text-ink">34 min</p>
                <p className="text-xs text-ink/70">Median Pickup</p>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* 2. Marquee of Live Rescues */}
      <section aria-label="Recent rescues ticker" className="glass overflow-hidden py-3.5">
        <div className="animate-marquee flex w-max items-center gap-10 whitespace-nowrap px-4">
          {[...MARQUEE_ITEMS, ...MARQUEE_ITEMS].map((item, idx) => (
            <span key={idx} className="inline-flex items-center gap-2 text-sm font-semibold text-ink">
              <span className="h-2.5 w-2.5 rounded-full bg-tangerine" aria-hidden="true" />
              {item}
            </span>
          ))}
        </div>
      </section>

      {/* 3. How it works in 3 steps */}
      <section className="space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-teal-700">Workflow</p>
            <h2 className="font-display text-3xl font-bold text-ink sm:text-4xl">
              From surplus tray to safe plate in 3 steps
            </h2>
          </div>
        </div>
        <div className="grid gap-5 md:grid-cols-3">
          {[
            {
              step: "01",
              title: "Post & Confirm",
              desc: "Snap a photo or speak a note. Vision AI drafts dish details; you confirm portions and storage.",
              icon: Utensils,
              tone: "glass-tangerine",
            },
            {
              step: "02",
              title: "Deterministic Safety & Match",
              desc: "Rules compute safe_by and block risky items. Top nearby NGOs are ranked fairly and alerted.",
              icon: ShieldAlert,
              tone: "glass-teal",
            },
            {
              step: "03",
              title: "Deliver & Count Impact",
              desc: "Volunteers follow a live batched route, capture delivery proof, and update your CSR receipt.",
              icon: CheckCircle2,
              tone: "glass-teal",
            },
          ].map(({ step, title, desc, icon: Icon, tone }) => (
            <div key={step} className="glass flex flex-col justify-between p-6">
              <div>
                <div className="flex items-center justify-between">
                  <span className={`inline-flex h-11 w-11 items-center justify-center rounded-2xl ${tone}`}>
                    <Icon className="h-5 w-5 text-ink" aria-hidden="true" />
                  </span>
                  <span className="tabular-nums text-sm font-bold text-ink/50">{step}</span>
                </div>
                <h3 className="mt-5 font-display text-xl font-bold text-ink">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink/75">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 4. Masonry Gallery of Rescue Cards */}
      <section className="space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-teal-700">Live Board Preview</p>
            <h2 className="font-display text-3xl font-bold text-ink sm:text-4xl">
              Surplus listings with live Safe-By Rings
            </h2>
          </div>
          <span className="text-xs font-medium text-ink/60">
            Sample data — verify before production use
          </span>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {SAMPLE_CARDS.map((card) => {
            const safeByIso = new Date(Date.now() + card.safeMinutes * 60000).toISOString();
            return (
              <motion.article
                key={card.id}
                whileHover={{ y: -6, rotate: 0.6 }}
                transition={{ duration: 0.2 }}
                className="glass flex flex-col justify-between overflow-hidden p-4"
              >
                <div
                  className={`relative flex h-44 items-center justify-center rounded-[22px] bg-gradient-to-br ${card.gradient} p-4`}
                >
                  <SafeByRing safeByIso={safeByIso}>
                    <div className="flex h-full w-full items-center justify-center bg-white/90 text-tangerine">
                      <Leaf className="h-6 w-6" aria-hidden="true" />
                    </div>
                  </SafeByRing>
                  <span
                    className={`absolute left-3 top-3 rounded-full px-3 py-1 text-[11px] font-bold ${
                      card.status === "Expiring soon"
                        ? "bg-tangerine text-white"
                        : card.status === "Delivered"
                        ? "bg-teal text-white"
                        : "bg-white/90 text-ink"
                    }`}
                  >
                    {card.status}
                  </span>
                </div>

                <div className="mt-4 space-y-2">
                  <h3 className="font-display text-lg font-bold leading-snug text-ink">
                    {card.title}
                  </h3>
                  <p className="text-xs font-medium text-ink/70">{card.donor}</p>
                  <div className="flex items-center justify-between pt-1 text-xs font-semibold">
                    <span className="tabular-nums rounded-full bg-teal-50 px-2.5 py-1 text-teal-700">
                      {card.portions} portions
                    </span>
                    <span className="inline-flex items-center gap-1 text-ink/70">
                      <Clock3 className="h-3.5 w-3.5" aria-hidden="true" />
                      {card.tag}
                    </span>
                  </div>
                </div>
              </motion.article>
            );
          })}
        </div>
      </section>

      {/* 5. Role Tabs (Donors / NGOs / Volunteers) */}
      <section className="glass p-8">
        <div className="flex flex-wrap gap-2">
          {(["donor", "receiver", "volunteer"] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`min-h-[48px] rounded-full px-6 py-2.5 text-sm font-bold capitalize transition ${
                activeTab === tab
                  ? "bg-teal text-white shadow-sm"
                  : "bg-white/60 text-ink hover:bg-white"
              }`}
            >
              For {tab === "receiver" ? "NGOs" : `${tab}s`}
            </button>
          ))}
        </div>

        <div className="mt-6 grid items-center gap-6 md:grid-cols-12">
          <div className="space-y-4 md:col-span-8">
            <h3 className="font-display text-2xl font-bold text-ink">{currentTab.heading}</h3>
            <ul className="space-y-2.5">
              {currentTab.points.map((pt) => (
                <li key={pt} className="flex items-start gap-2.5 text-sm text-ink/80">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-teal-700" aria-hidden="true" />
                  <span>{pt}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="flex md:col-span-4 md:justify-end">
            <Link
              href={currentTab.ctaHref}
              className="inline-flex min-h-[52px] items-center gap-2 rounded-full bg-tangerine px-6 py-3 text-sm font-bold text-white shadow-md hover:bg-tangerine-700"
            >
              <span>{currentTab.ctaLabel}</span>
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

