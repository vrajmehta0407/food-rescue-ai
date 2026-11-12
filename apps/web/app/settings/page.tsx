"use client";

import { useState } from "react";
import { Download, Lock, Trash2 } from "lucide-react";
import { useAppStore } from "@/lib/store";

export default function PrivacySettingsPage() {
  const { profile, setProfile, exportUserData, deleteAccount } = useAppStore();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const handleExport = () => {
    const json = exportUserData();
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "foodrescue-dpdp-export.json";
    a.click();
    URL.revokeObjectURL(url);
    setStatusMsg("Your DPDP data export JSON has been downloaded.");
  };

  const handleDelete = () => {
    deleteAccount();
    setConfirmDelete(false);
    setStatusMsg("Your profile and local account data have been erased.");
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="glass p-8 space-y-6">
        <div>
          <span className="glass-teal inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold text-teal-700">
            <Lock className="h-3.5 w-3.5" aria-hidden="true" />
            FR-11 • Privacy & DPDP Controls
          </span>
          <h1 className="mt-2 font-display text-3xl font-bold text-ink">
            Account Privacy, Export & Erasure
          </h1>
          <p className="mt-1 text-sm text-ink/75">
            Phone numbers are masked before LLM calls, photo EXIF GPS data is stripped on upload,
            and exact pickup addresses remain hidden until a match is accepted.
          </p>
        </div>

        {profile ? (
          <div className="rounded-[22px] bg-white/80 p-5 space-y-3 text-sm">
            <p>
              <strong>Partner:</strong> {profile.orgName} ({profile.role})
            </p>
            <p>
              <strong>Masked Phone:</strong> {profile.phoneMasked}
            </p>
            <label className="flex cursor-pointer items-center gap-3 pt-1">
              <input
                type="checkbox"
                checked={profile.optInLeaderboard}
                onChange={(e) =>
                  setProfile({ ...profile, optInLeaderboard: e.target.checked })
                }
                className="h-5 w-5 accent-teal"
              />
              <span className="font-semibold text-ink">
                Show my organization on the public Ahmedabad Impact Leaderboard
              </span>
            </label>
          </div>
        ) : (
          <div className="glass-tangerine rounded-[22px] p-4 text-sm font-semibold text-ink">
            No active profile. Visit Verify Role to create one.
          </div>
        )}

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleExport}
            className="inline-flex min-h-[50px] items-center gap-2 rounded-full bg-teal px-6 text-sm font-bold text-white hover:bg-teal-700"
          >
            <Download className="h-4 w-4" aria-hidden="true" />
            <span>Export My Data (JSON)</span>
          </button>

          {!confirmDelete ? (
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              className="inline-flex min-h-[50px] items-center gap-2 rounded-full border border-tangerine bg-white px-6 text-sm font-bold text-tangerine-700 hover:bg-tangerine-50"
            >
              <Trash2 className="h-4 w-4" aria-hidden="true" />
              <span>Delete Account</span>
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleDelete}
                className="min-h-[50px] rounded-full bg-tangerine px-6 text-sm font-bold text-white"
              >
                Confirm Permanent Erase
              </button>
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                className="min-h-[50px] rounded-full bg-white px-4 text-xs font-bold text-ink"
              >
                Cancel
              </button>
            </div>
          )}
        </div>

        {statusMsg && (
          <p role="status" className="glass-teal rounded-2xl p-4 text-sm font-semibold text-teal-700">
            {statusMsg}
          </p>
        )}
      </div>
    </div>
  );
}

