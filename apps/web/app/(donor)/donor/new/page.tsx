"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  Camera,
  CheckCircle2,
  Mic,
  ShieldAlert,
  Sparkles,
  WifiOff,
} from "lucide-react";
import {
  SAFETY_RULES,
  calculateImpactLocal,
  evaluateSafetyLocal,
  type PackagingType,
  type StorageMethod,
} from "@/lib/safety";
import { stripExifAndResize } from "@/lib/exif";
import { useAppStore } from "@/lib/store";

const ALL_ALLERGENS = ["dairy", "gluten", "tree_nuts", "peanuts", "soy"];

function toLocalDatetimeInput(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours()
  )}:${pad(date.getMinutes())}`;
}

export default function NewListingPage() {
  const router = useRouter();
  const { profile, addListing, queueOfflineListing } = useAppStore();

  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoFilename, setPhotoFilename] = useState<string>("");
  const [voiceNote, setVoiceNote] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [aiProvider, setAiProvider] = useState<string | null>(null);
  const [lowConfidenceFields, setLowConfidenceFields] = useState<string[]>([]);

  const [title, setTitle] = useState("Veg Biryani & Boondi Raita");
  const [category, setCategory] = useState("cooked_rice_dish");
  const [veg, setVeg] = useState(true);
  const [portions, setPortions] = useState(40);
  const [allergens, setAllergens] = useState<string[]>(["dairy"]);
  const [packaging, setPackaging] = useState<PackagingType>("sealed_containers");
  const [storageMethod, setStorageMethod] = useState<StorageMethod>("ambient");
  const [preparedAt, setPreparedAt] = useState(() =>
    toLocalDatetimeInput(new Date(Date.now() - 20 * 60000))
  );
  const [pickupArea, setPickupArea] = useState("Navrangpura, Ahmedabad");
  const [pickupAddressExact, setPickupAddressExact] = useState("42 CG Road, Near Municipal Market");
  const [safetyConfirmed, setSafetyConfirmed] = useState(false);
  const [submitState, setSubmitState] = useState<{
    type: "success" | "blocked" | "offline" | "error";
    message: string;
  } | null>(null);

  const liveSafety = useMemo(() => {
    const iso = new Date(preparedAt).toISOString();
    return evaluateSafetyLocal({
      category,
      prepared_at: iso,
      storage_method: storageMethod,
      packaging,
    });
  }, [category, preparedAt, storageMethod, packaging]);

  const liveImpact = useMemo(() => calculateImpactLocal(category, portions), [category, portions]);

  const handlePhotoUpload = async (file: File) => {
    setPhotoFilename(file.name);
    try {
      // Strip EXIF GPS location metadata before preview or upload
      const cleanDataUrl = await stripExifAndResize(file);
      setPhotoPreview(cleanDataUrl);
      await runVisionAnalyze(cleanDataUrl, file.name);
    } catch {
      const reader = new FileReader();
      reader.onload = async () => {
        const dataUrl = typeof reader.result === "string" ? reader.result : null;
        setPhotoPreview(dataUrl);
        await runVisionAnalyze(dataUrl, file.name);
      };
      reader.readAsDataURL(file);
    }
  };

  const runVisionAnalyze = async (imgDataUrl: string | null, filename: string) => {
    setAnalyzing(true);
    try {
      const res = await fetch("/api/listings/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image_base64: imgDataUrl,
          filename,
          voice_note: voiceNote,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setCategory(data.category);
        setTitle(
          Array.isArray(data.items) && data.items.length > 0
            ? data.items.map((s: string) => s[0].toUpperCase() + s.slice(1)).join(" & ")
            : title
        );
        setVeg(Boolean(data.veg));
        if (typeof data.estimated_portions === "number") {
          setPortions(data.estimated_portions);
        }
        if (Array.isArray(data.allergens)) {
          setAllergens(data.allergens);
        }
        if (data.packaging) {
          setPackaging(data.packaging);
        }
        setLowConfidenceFields(data.low_confidence_fields ?? []);
        setAiProvider(data.provider ?? "mock");
      }
    } finally {
      setAnalyzing(false);
    }
  };

  const toggleAllergen = (item: string) => {
    setAllergens((prev) =>
      prev.includes(item) ? prev.filter((a) => a !== item) : [...prev, item]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitState(null);

    if (!safetyConfirmed) {
      setSubmitState({
        type: "error",
        message: "Please confirm the food hygiene & accuracy declaration before submitting.",
      });
      return;
    }

    const preparedIso = new Date(preparedAt).toISOString();

    if (typeof navigator !== "undefined" && !navigator.onLine) {
      queueOfflineListing({
        id: `offline-${Date.now()}`,
        donorName: profile?.orgName || "Donor",
        title,
        category,
        items: [title],
        veg,
        portions,
        kg: liveImpact.kg,
        allergens,
        packaging,
        storageMethod,
        preparedAt: preparedIso,
        safeBy: liveSafety.safe_by,
        safetyDecision: liveSafety.decision,
        safetyExplanation: liveSafety.explanation,
        pickupArea,
        pickupAddressExact,
        lat: 23.0338,
        lon: 72.5624,
        photoDataUrl: photoPreview ?? undefined,
        status: liveSafety.decision === "BLOCK" ? "blocked" : "open",
        synced: false,
        declinedReceiverIds: [],
        matchRadiusKm: 5,
        createdAt: new Date().toISOString(),
      });
      setSubmitState({
        type: "offline",
        message: "You are offline. Listing saved locally and will auto-sync when back online.",
      });
      return;
    }

    const res = await fetch("/api/listings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        category,
        items: [title],
        veg,
        portions,
        allergens,
        packaging,
        storage_method: storageMethod,
        prepared_at: preparedIso,
        pickup_area: pickupArea,
        pickup_address_exact: pickupAddressExact,
        donor_safety_confirmed: true,
      }),
    });

    const data = await res.json();
    if (res.status === 422 || data.blocked) {
      setSubmitState({
        type: "blocked",
        message: data.safety?.explanation || data.message || "Blocked by Food Safety Rules Engine.",
      });
      return;
    }

    if (!res.ok) {
      setSubmitState({
        type: "error",
        message: data.error || "Unable to create listing.",
      });
      return;
    }

    addListing({
      id: data.listing.id,
      donorName: profile?.orgName || "Spice Hub Kitchen",
      title,
      category,
      items: [title],
      veg,
      portions,
      kg: data.listing.kg,
      allergens,
      packaging,
      storageMethod,
      preparedAt: preparedIso,
      safeBy: data.safety.safe_by,
      safetyDecision: data.safety.decision,
      safetyExplanation: data.safety.explanation,
      pickupArea,
      pickupAddressExact,
      lat: 23.0338,
      lon: 72.5624,
      photoDataUrl: photoPreview ?? undefined,
      status: "open",
      synced: true,
      declinedReceiverIds: [],
      matchRadiusKm: 5,
      createdAt: data.listing.created_at,
    });

    setSubmitState({
      type: "success",
      message: "Listing approved by Safety Rules Engine and posted for matching!",
    });
    setTimeout(() => router.push("/donor"), 900);
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="glass p-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="glass-tangerine inline-flex items-center gap-1.5 rounded-full px-3.5 py-1 text-xs font-bold text-ink">
              <Sparkles className="h-3.5 w-3.5 text-tangerine" aria-hidden="true" />
              30-Second Surplus Intake
            </span>
            <h1 className="mt-2 font-display text-3xl font-bold text-ink">
              Post surplus food for rescue
            </h1>
          </div>
          <span className="text-xs font-medium text-ink/60">
            Sample safety rules — verify before production use
          </span>
        </div>

        {/* Photo + Voice Note AI Pre-fill */}
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <label
            htmlFor="food-photo"
            className="flex min-h-[140px] cursor-pointer flex-col items-center justify-center rounded-[22px] border border-dashed border-tangerine/50 bg-white/70 p-4 text-center transition hover:bg-white"
          >
            {photoPreview ? (
              <img
                src={photoPreview}
                alt="Uploaded surplus food preview"
                className="h-28 w-full rounded-2xl object-cover"
              />
            ) : (
              <>
                <Camera className="h-7 w-7 text-tangerine" aria-hidden="true" />
                <span className="mt-2 text-sm font-bold text-ink">
                  Snap or upload food photo
                </span>
                <span className="text-xs text-ink/65">
                  AI pre-fills category, portions & allergens
                </span>
              </>
            )}
            <input
              id="food-photo"
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void handlePhotoUpload(f);
              }}
            />
          </label>

          <div className="flex flex-col justify-between rounded-[22px] border border-ink/10 bg-white/70 p-4">
            <div>
              <label
                htmlFor="voice-note"
                className="flex items-center gap-1.5 text-sm font-bold text-ink"
              >
                <Mic className="h-4 w-4 text-teal-700" aria-hidden="true" />
                Optional Voice / Quick Note (PII auto-masked)
              </label>
              <textarea
                id="voice-note"
                rows={3}
                value={voiceNote}
                onChange={(e) => setVoiceNote(e.target.value)}
                placeholder="e.g. 40 plates veg biryani and raita in sealed containers"
                className="mt-2 w-full rounded-2xl border border-ink/15 bg-white p-3 text-sm text-ink"
              />
            </div>
            <div className="mt-2 flex items-center justify-between">
              <span className="text-xs text-ink/65">
                {aiProvider ? `Pre-filled via ${aiProvider}` : "Ready for AI pre-fill"}
              </span>
              <button
                type="button"
                disabled={analyzing}
                onClick={() => void runVisionAnalyze(photoPreview, photoFilename || "biryani.jpg")}
                className="min-h-[40px] rounded-full bg-teal px-4 text-xs font-bold text-white hover:bg-teal-700 disabled:opacity-50"
              >
                {analyzing ? "Analyzing..." : "AI Pre-fill"}
              </button>
            </div>
          </div>
        </div>

        {/* Donor Confirmation Form */}
        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="listing-title" className="block text-sm font-bold text-ink">
                Dish / Listing Title
              </label>
              <input
                id="listing-title"
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="mt-1.5 min-h-[48px] w-full rounded-[22px] border border-ink/15 bg-white px-4 text-sm text-ink"
              />
            </div>

            <div>
              <label htmlFor="food-category" className="block text-sm font-bold text-ink">
                Food Category{" "}
                {lowConfidenceFields.includes("category") && (
                  <span className="ml-1 rounded-full bg-tangerine-100 px-2 py-0.5 text-[10px] font-bold text-tangerine-700">
                    Confirm AI guess
                  </span>
                )}
              </label>
              <select
                id="food-category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="mt-1.5 min-h-[48px] w-full rounded-[22px] border border-ink/15 bg-white px-4 text-sm text-ink"
              >
                {Object.entries(SAFETY_RULES.categories).map(([key, val]) => (
                  <option key={key} value={key}>
                    {val.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            {/* Quantity Stepper */}
            <div>
              <label htmlFor="portions" className="block text-sm font-bold text-ink">
                Portions{" "}
                {lowConfidenceFields.includes("estimated_portions") && (
                  <span className="ml-1 rounded-full bg-tangerine-100 px-2 py-0.5 text-[10px] font-bold text-tangerine-700">
                    Low AI confidence
                  </span>
                )}
              </label>
              <div className="mt-1.5 flex min-h-[48px] items-center justify-between rounded-full border border-ink/15 bg-white px-2">
                <button
                  type="button"
                  onClick={() => setPortions((p) => Math.max(5, p - 5))}
                  aria-label="Decrease portions"
                  className="h-9 w-9 rounded-full bg-teal-50 text-lg font-bold text-teal-700 hover:bg-teal-100"
                >
                  -
                </button>
                <input
                  id="portions"
                  type="number"
                  min={1}
                  max={5000}
                  value={portions}
                  onChange={(e) => setPortions(Math.max(1, Number(e.target.value) || 1))}
                  className="tabular-nums w-20 bg-transparent text-center text-base font-bold text-ink"
                />
                <button
                  type="button"
                  onClick={() => setPortions((p) => p + 5)}
                  aria-label="Increase portions"
                  className="h-9 w-9 rounded-full bg-tangerine-50 text-lg font-bold text-tangerine-700 hover:bg-tangerine-100"
                >
                  +
                </button>
              </div>
              <p className="tabular-nums mt-1 text-xs text-ink/65">
                ~{liveImpact.kg} kg • ~₹{liveImpact.value_inr} sample value
              </p>
            </div>

            <div>
              <label htmlFor="packaging" className="block text-sm font-bold text-ink">
                Packaging
              </label>
              <select
                id="packaging"
                value={packaging}
                onChange={(e) => setPackaging(e.target.value as PackagingType)}
                className="mt-1.5 min-h-[48px] w-full rounded-[22px] border border-ink/15 bg-white px-4 text-sm text-ink"
              >
                <option value="sealed_containers">Sealed Containers</option>
                <option value="covered_trays">Covered Trays</option>
                <option value="open_unsealed">Open / Unsealed</option>
              </select>
            </div>

            <div>
              <label htmlFor="storage-method" className="block text-sm font-bold text-ink">
                Storage Condition
              </label>
              <select
                id="storage-method"
                value={storageMethod}
                onChange={(e) => setStorageMethod(e.target.value as StorageMethod)}
                className="mt-1.5 min-h-[48px] w-full rounded-[22px] border border-ink/15 bg-white px-4 text-sm text-ink"
              >
                <option value="ambient">Room Temp (Ambient)</option>
                <option value="chilled">Chilled (&lt; 5°C)</option>
              </select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label htmlFor="prepared-at" className="block text-sm font-bold text-ink">
                Prepared At
              </label>
              <input
                id="prepared-at"
                type="datetime-local"
                value={preparedAt}
                onChange={(e) => setPreparedAt(e.target.value)}
                className="mt-1.5 min-h-[48px] w-full rounded-[22px] border border-ink/15 bg-white px-4 text-sm text-ink"
              />
            </div>

            <div>
              <label htmlFor="pickup-area" className="block text-sm font-bold text-ink">
                Approx Area (Visible Before Match)
              </label>
              <input
                id="pickup-area"
                type="text"
                required
                value={pickupArea}
                onChange={(e) => setPickupArea(e.target.value)}
                className="mt-1.5 min-h-[48px] w-full rounded-[22px] border border-ink/15 bg-white px-4 text-sm text-ink"
              />
            </div>

            <div>
              <label htmlFor="pickup-exact" className="block text-sm font-bold text-ink">
                Exact Address (Hidden Until Accepted)
              </label>
              <input
                id="pickup-exact"
                type="text"
                required
                value={pickupAddressExact}
                onChange={(e) => setPickupAddressExact(e.target.value)}
                className="mt-1.5 min-h-[48px] w-full rounded-[22px] border border-ink/15 bg-white px-4 text-sm text-ink"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 rounded-[22px] bg-white/70 p-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-ink">Dietary & Allergens:</span>
              <button
                type="button"
                onClick={() => setVeg((v) => !v)}
                className={`rounded-full px-3 py-1.5 text-xs font-bold ${
                  veg ? "bg-teal text-white" : "bg-tangerine text-white"
                }`}
              >
                {veg ? "Vegetarian" : "Non-Veg"}
              </button>
              {ALL_ALLERGENS.map((item) => {
                const active = allergens.includes(item);
                return (
                  <button
                    key={item}
                    type="button"
                    onClick={() => toggleAllergen(item)}
                    className={`rounded-full px-3 py-1.5 text-xs font-semibold capitalize ${
                      active
                        ? "bg-tangerine-100 text-tangerine-700 border border-tangerine/40"
                        : "bg-white text-ink/70 border border-ink/10"
                    }`}
                  >
                    {item.replace("_", " ")}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Live Deterministic Food Safety Preview */}
          <div
            className={`rounded-[22px] p-5 ${
              liveSafety.decision === "BLOCK"
                ? "glass-tangerine border-2 border-tangerine"
                : liveSafety.decision === "APPROVE_WITH_WARNING"
                ? "glass-tangerine"
                : "glass-teal"
            }`}
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="flex items-center gap-2 text-sm font-bold text-ink">
                <ShieldAlert className="h-5 w-5 text-tangerine" aria-hidden="true" />
                Food Safety Rules Engine Decision:{" "}
                <span className="underline">{liveSafety.decision}</span>
              </span>
              <span className="tabular-nums text-xs font-bold text-ink">
                Safe by: {new Date(liveSafety.safe_by).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} ({liveSafety.remaining_minutes} min left)
              </span>
            </div>
            <p className="mt-1.5 text-sm text-ink/85">{liveSafety.explanation}</p>
          </div>

          <label className="flex cursor-pointer items-start gap-3 rounded-[22px] bg-white/70 p-4 text-sm text-ink">
            <input
              type="checkbox"
              checked={safetyConfirmed}
              onChange={(e) => setSafetyConfirmed(e.target.checked)}
              className="mt-1 h-5 w-5 accent-teal"
            />
            <span>
              I confirm this food was freshly prepared, stored hygienically, and the quantities and
              preparation time above are accurate.
            </span>
          </label>

          <button
            type="submit"
            disabled={liveSafety.decision === "BLOCK"}
            className="min-h-[54px] w-full rounded-full bg-tangerine px-6 py-3.5 text-base font-bold text-white shadow-lg shadow-tangerine/25 transition hover:bg-tangerine-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {liveSafety.decision === "BLOCK"
              ? "Blocked by Safety Rules (Cannot Submit)"
              : "Confirm & Submit Surplus Listing"}
          </button>

          {submitState && (
            <div
              role="status"
              className={`flex items-center gap-2 rounded-2xl p-4 text-sm font-semibold ${
                submitState.type === "success"
                  ? "glass-teal text-teal-700"
                  : submitState.type === "offline"
                  ? "glass-tangerine text-ink"
                  : "glass-tangerine text-tangerine-700"
              }`}
            >
              {submitState.type === "success" ? (
                <CheckCircle2 className="h-5 w-5 shrink-0" aria-hidden="true" />
              ) : submitState.type === "offline" ? (
                <WifiOff className="h-5 w-5 shrink-0" aria-hidden="true" />
              ) : (
                <AlertCircle className="h-5 w-5 shrink-0" aria-hidden="true" />
              )}
              <span>{submitState.message}</span>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}

