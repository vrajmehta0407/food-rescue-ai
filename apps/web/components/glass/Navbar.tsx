"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Award,
  Bike,
  HeartHandshake,
  PlusCircle,
  Settings,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  UtensilsCrossed,
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/", label: "Home", icon: Sparkles },
  { href: "/donor", label: "Donor", icon: HeartHandshake },
  { href: "/receiver", label: "Receiver", icon: UtensilsCrossed },
  { href: "/volunteer", label: "Volunteer", icon: Bike },
  { href: "/impact", label: "Impact", icon: Award },
  { href: "/admin", label: "Admin", icon: ShieldAlert },
  { href: "/onboarding", label: "Verify", icon: ShieldCheck },
  { href: "/settings", label: "Privacy", icon: Settings },
  { href: "/donor/new", label: "Rescue Food", icon: PlusCircle },
];

export function Navbar() {
  const pathname = usePathname();

  return (
    <header className="sticky top-3 z-40 mx-auto max-w-7xl px-4">
      <nav
        aria-label="Primary navigation"
        className="glass flex flex-wrap items-center justify-between gap-2 px-4 py-2.5"
      >
        <Link
          href="/"
          className="flex items-center gap-2 font-display text-lg font-bold tracking-tight text-ink"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-tangerine text-sm font-extrabold text-white shadow-md">
            FR
          </span>
          <span>
            FoodRescue <span className="text-berry">AI</span>
          </span>
        </Link>

        <div className="flex flex-wrap items-center gap-1.5">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            const isPrimaryCta = href === "/donor/new";
            return (
              <Link
                key={href}
                href={href}
                className={`inline-flex min-h-[44px] items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-bold transition-all sm:text-sm ${
                  isPrimaryCta
                    ? "bg-tangerine text-white shadow-md hover:bg-tangerine-700"
                    : active
                    ? "bg-teal text-white shadow-sm"
                    : "text-ink hover:bg-teal/10"
                }`}
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
                <span>{label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </header>
  );
}
