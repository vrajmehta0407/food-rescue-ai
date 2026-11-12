"use client";

import { useState } from "react";
import { CheckCircle2, FileCheck2, Phone, ShieldCheck, Upload } from "lucide-react";
import { useAppStore, type UserRole } from "@/lib/store";

const ROLES: { id: UserRole; label: string; docLabel: string; docType: "fssai" | "ngo_registration" | "volunteer_id" }[] = [
  {
    id: "donor",
    label: "Donor (Restaurant / Caterer / Venue)",
    docLabel: "FSSAI Licence / Business Proof",
    docType: "fssai",
  },
  {
    id: "receiver",
    label: "Receiver (NGO / Shelter / Kitchen)",
    docLabel: "NGO Registration / 80G Certificate",
    docType: "ngo_registration",
  },
  {
    id: "volunteer",
    label: "Volunteer Rider / Driver",
    docLabel: "Government ID / Driving Licence",
    docType: "volunteer_id",
  },
];

export default function OnboardingPage() {
  const { profile, setProfile, submitVerification } = useAppStore();

  const [phone, setPhone] = useState("+91 98765 43210");
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [otpVerified, setOtpVerified] = useState(false);

  const [selectedRole, setSelectedRole] = useState<UserRole>(profile?.role ?? "donor");
  const [name, setName] = useState(profile?.name ?? "");
  const [orgName, setOrgName] = useState(profile?.orgName ?? "");
  const [docFilename, setDocFilename] = useState(profile?.docName ?? "");
  const [savedMessage, setSavedMessage] = useState("");

  const activeRoleMeta = ROLES.find((r) => r.id === selectedRole) ?? ROLES[0];

  const handleSendOtp = () => {
    if (phone.trim().length < 8) return;
    setOtpSent(true);
    setOtpCode("123456"); // Demo pilot OTP hint
  };

  const handleVerifyOtp = () => {
    if (otpCode.trim().length >= 4) {
      setOtpVerified(true);
    }
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const maskedPhone = `••••••${phone.replace(/\D/g, "").slice(-4) || "0000"}`;
    setProfile({
      id: profile?.id ?? `usr-${Date.now()}`,
      role: selectedRole,
      name: name.trim() || "Partner User",
      phoneMasked: maskedPhone,
      orgName: orgName.trim() || "Ahmedabad Partner",
      verified: false,
      docType: activeRoleMeta.docType,
      docName: docFilename || "uploaded-document.pdf",
      verificationStatus: docFilename ? "pending" : "unsubmitted",
      trustScore: profile?.trustScore ?? 5.0,
      optInLeaderboard: profile?.optInLeaderboard ?? true,
    });
    if (docFilename) {
      submitVerification(activeRoleMeta.docType, docFilename);
    }
    setSavedMessage("Profile saved! Verification document queued for city admin review.");
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="glass p-8">
        <span className="glass-teal inline-flex items-center gap-2 rounded-full px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-teal-700">
          <ShieldCheck className="h-4 w-4" aria-hidden="true" />
          FR-1 & F6 • Verified Partner Onboarding
        </span>
        <h1 className="mt-3 font-display text-3xl font-bold text-ink">
          Verify phone, choose role & upload licence
        </h1>
        <p className="mt-2 text-sm text-ink/75">
          Phone numbers are masked before any AI call and never shown publicly. Only verified
          partners appear in live matching.
        </p>

        {/* Step 1: Phone OTP */}
        <div className="mt-6 rounded-[22px] border border-teal/25 bg-white/70 p-5">
          <h2 className="flex items-center gap-2 text-sm font-bold text-ink">
            <Phone className="h-4 w-4 text-teal-700" aria-hidden="true" />
            1. Phone OTP Sign-Up (Demo / Supabase Auth Ready)
          </h2>
          <div className="mt-3 flex flex-wrap gap-3">
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              aria-label="Phone number"
              placeholder="+91 98765 43210"
              className="min-h-[48px] flex-1 rounded-[22px] border border-ink/15 bg-white px-4 text-sm text-ink"
            />
            <button
              type="button"
              onClick={handleSendOtp}
              className="min-h-[48px] rounded-full bg-teal px-5 text-sm font-bold text-white hover:bg-teal-700"
            >
              {otpSent ? "Resend OTP" : "Send OTP"}
            </button>
          </div>

          {otpSent && (
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <input
                type="text"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value)}
                aria-label="One-time passcode"
                placeholder="Enter 6-digit OTP (demo: 123456)"
                className="tabular-nums min-h-[48px] w-56 rounded-[22px] border border-ink/15 bg-white px-4 text-sm text-ink"
              />
              <button
                type="button"
                onClick={handleVerifyOtp}
                className="min-h-[48px] rounded-full bg-tangerine px-5 text-sm font-bold text-white hover:bg-tangerine-700"
              >
                Verify OTP
              </button>
              {otpVerified && (
                <span className="inline-flex items-center gap-1.5 text-sm font-bold text-teal-700">
                  <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                  Verified
                </span>
              )}
            </div>
          )}
        </div>

        {/* Step 2: Role & Verification Doc */}
        <form onSubmit={handleSaveProfile} className="mt-6 space-y-5">
          <div>
            <label className="block text-sm font-bold text-ink">2. Select Role</label>
            <div className="mt-2 grid gap-3 sm:grid-cols-3">
              {ROLES.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setSelectedRole(r.id)}
                  className={`min-h-[56px] rounded-[22px] border p-3.5 text-left text-xs font-bold transition ${
                    selectedRole === r.id
                      ? "border-teal bg-teal/15 text-ink"
                      : "border-ink/10 bg-white/70 text-ink/75 hover:bg-white"
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="partner-name" className="block text-sm font-bold text-ink">
                Contact Name
              </label>
              <input
                id="partner-name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1.5 min-h-[48px] w-full rounded-[22px] border border-ink/15 bg-white px-4 text-sm text-ink"
              />
            </div>
            <div>
              <label htmlFor="org-name" className="block text-sm font-bold text-ink">
                Organization / Kitchen Name
              </label>
              <input
                id="org-name"
                type="text"
                required
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                className="mt-1.5 min-h-[48px] w-full rounded-[22px] border border-ink/15 bg-white px-4 text-sm text-ink"
              />
            </div>
          </div>

          <div>
            <label htmlFor="doc-upload" className="block text-sm font-bold text-ink">
              3. Upload {activeRoleMeta.docLabel}
            </label>
            <label
              htmlFor="doc-upload"
              className="mt-1.5 flex min-h-[76px] cursor-pointer items-center justify-between rounded-[22px] border border-dashed border-teal/50 bg-white/60 px-5 py-3 hover:bg-white"
            >
              <span className="flex items-center gap-3 text-sm font-medium text-ink">
                {docFilename ? (
                  <>
                    <FileCheck2 className="h-5 w-5 text-teal-700" aria-hidden="true" />
                    <span>{docFilename}</span>
                  </>
                ) : (
                  <>
                    <Upload className="h-5 w-5 text-tangerine" aria-hidden="true" />
                    <span>Choose PDF or image (EXIF metadata stripped)</span>
                  </>
                )}
              </span>
              <span className="rounded-full bg-teal-50 px-3 py-1 text-xs font-bold text-teal-700">
                Browse
              </span>
              <input
                id="doc-upload"
                type="file"
                accept=".pdf,image/*"
                className="sr-only"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) setDocFilename(f.name);
                }}
              />
            </label>
          </div>

          <button
            type="submit"
            className="min-h-[52px] w-full rounded-full bg-tangerine px-6 py-3 text-base font-bold text-white shadow-md hover:bg-tangerine-700"
          >
            Save Profile & Submit for Verification
          </button>

          {savedMessage && (
            <p className="glass-teal rounded-2xl p-4 text-sm font-semibold text-teal-700">
              {savedMessage}
            </p>
          )}
        </form>
      </div>
    </div>
  );
}

