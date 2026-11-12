"use client";

import { useState } from "react";
import confetti from "canvas-confetti";
import { Bike, Camera, CheckCircle2, Clock3, Navigation, RefreshCw } from "lucide-react";
import { RescueMap } from "@/components/map/RescueMap";
import { stripExifAndResize } from "@/lib/exif";
import { useAppStore } from "@/lib/store";

export default function VolunteerTasksPage() {
  const { tasks, updateTaskStatus, simulateVolunteerStall } = useAppStore();
  const [sliderValue, setSliderValue] = useState<Record<string, number>>({});
  const [notice, setNotice] = useState<string | null>(null);
  const [receiverConfirmedMap, setReceiverConfirmedMap] = useState<Record<string, boolean>>({});

  const fireDeliveryConfetti = () => {
    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) return;

    void confetti({
      particleCount: 85,
      spread: 75,
      origin: { y: 0.65 },
      colors: ["#FF5C1F", "#00B8A9", "#FF3D8B"],
    });
  };

  const handleSlideConfirmPickup = (taskId: string, val: number) => {
    setSliderValue((prev) => ({ ...prev, [taskId]: val }));
    if (val >= 95) {
      updateTaskStatus(taskId, "picked");
      setNotice("Pickup confirmed! Navigate to receiver drop-off.");
    }
  };

  const handleProofUpload = async (taskId: string, file: File) => {
    try {
      const cleanUrl = await stripExifAndResize(file);
      updateTaskStatus(taskId, "picked", cleanUrl);
      setNotice("Delivery proof photo attached (EXIF stripped).");
    } catch {
      // Fallback
    }
  };

  return (
    <div className="space-y-8">
      <section className="glass flex flex-wrap items-center justify-between gap-4 p-7">
        <div>
          <span className="glass-teal inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold text-teal-700">
            <Bike className="h-4 w-4" aria-hidden="true" />
            F3 • Volunteer Logistics & Live Route
          </span>
          <h1 className="mt-2 font-display text-3xl font-bold text-ink">
            Active Pickup & Delivery Tasks
          </h1>
          <p className="text-sm text-ink/75">
            Large 48px+ tap targets. Nearby pickups within 2 km are batched automatically.
          </p>
        </div>
      </section>

      {notice && (
        <div role="status" className="glass-teal flex items-center justify-between p-4 text-sm font-semibold text-teal-700">
          <span>{notice}</span>
          <button
            type="button"
            onClick={() => setNotice(null)}
            className="rounded-full bg-white px-3 py-1 text-xs font-bold text-ink"
          >
            OK
          </button>
        </div>
      )}

      {tasks.length === 0 ? (
        <div className="glass p-10 text-center text-sm font-semibold text-ink/70">
          No active tasks right now. Accept a match from the Receiver Feed to dispatch a rider!
        </div>
      ) : (
        <div className="space-y-6">
          {tasks.map((task) => {
            const slider = sliderValue[task.id] ?? 0;
            const confirmed = receiverConfirmedMap[task.id] ?? task.receiverConfirmed;
            const routeCoords: [number, number][] = [
              [task.pickupLon, task.pickupLat],
              [(task.pickupLon + task.dropLon) / 2 + 0.002, (task.pickupLat + task.dropLat) / 2 + 0.002],
              [task.dropLon, task.dropLat],
            ];

            return (
              <article key={task.id} className="glass space-y-5 p-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-bold uppercase ${
                          task.status === "delivered"
                            ? "bg-teal text-white"
                            : task.status === "picked"
                            ? "bg-teal-100 text-teal-700"
                            : "bg-tangerine text-white"
                        }`}
                      >
                        {task.status}
                      </span>
                      <span className="tabular-nums inline-flex items-center gap-1 rounded-full bg-white/80 px-3 py-1 text-xs font-bold text-ink">
                        <Clock3 className="h-3.5 w-3.5 text-tangerine" aria-hidden="true" />
                        ETA {task.etaMinutes} min • {task.distanceKm} km
                      </span>
                    </div>
                    <h2 className="mt-2 font-display text-2xl font-bold text-ink">
                      {task.listingTitle} ({task.portions} portions)
                    </h2>
                    <p className="text-sm text-ink/75">
                      Rider: <strong>{task.volunteerName}</strong> • Mode:{" "}
                      <span className="capitalize">{task.fallbackMode.replace(/_/g, " ")}</span>
                    </p>
                  </div>

                  {task.status !== "delivered" && (
                    <button
                      type="button"
                      onClick={() => setNotice(simulateVolunteerStall(task.id))}
                      className="inline-flex min-h-[48px] items-center gap-2 rounded-full border border-tangerine/40 bg-white/80 px-4 text-xs font-bold text-tangerine-700 hover:bg-tangerine-50"
                    >
                      <RefreshCw className="h-4 w-4" aria-hidden="true" />
                      <span>Simulate 10m Stall / Reassign</span>
                    </button>
                  )}
                </div>

                {/* Live Map & Route Strip */}
                <RescueMap
                  heightClass="h-56"
                  routeCoords={routeCoords}
                  points={[
                    {
                      id: `${task.id}-p`,
                      label: `Pickup: ${task.donorName}`,
                      sublabel: task.pickupAddressExact,
                      lat: task.pickupLat,
                      lon: task.pickupLon,
                      kind: "donor",
                    },
                    {
                      id: `${task.id}-d`,
                      label: `Drop: ${task.receiverName}`,
                      sublabel: task.dropArea,
                      lat: task.dropLat,
                      lon: task.dropLon,
                      kind: "receiver",
                    },
                  ]}
                />

                <div className="grid gap-4 rounded-[22px] bg-white/75 p-4 text-sm sm:grid-cols-2">
                  <div>
                    <p className="text-xs font-bold uppercase text-tangerine-700">
                      1. Pickup Address (Unlocked)
                    </p>
                    <p className="mt-1 font-semibold text-ink">{task.donorName}</p>
                    <p className="text-xs text-ink/75">{task.pickupAddressExact}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase text-teal-700">2. Drop-Off Receiver</p>
                    <p className="mt-1 font-semibold text-ink">{task.receiverName}</p>
                    <p className="text-xs text-ink/75">{task.dropArea}</p>
                  </div>
                </div>

                {/* Slide-to-Confirm Pickup */}
                {task.status === "accepted" && (
                  <div className="glass-tangerine rounded-[24px] p-5">
                    <label
                      htmlFor={`slide-${task.id}`}
                      className="flex items-center justify-between text-sm font-bold text-ink"
                    >
                      <span className="flex items-center gap-2">
                        <Navigation className="h-4 w-4 text-tangerine" aria-hidden="true" />
                        Slide right to confirm pickup
                      </span>
                      <span className="tabular-nums text-xs">{slider}%</span>
                    </label>
                    <input
                      id={`slide-${task.id}`}
                      type="range"
                      min={0}
                      max={100}
                      value={slider}
                      onChange={(e) => handleSlideConfirmPickup(task.id, Number(e.target.value))}
                      className="mt-3 h-10 w-full cursor-pointer accent-tangerine"
                    />
                  </div>
                )}

                {/* Proof of Delivery + Receiver Tap */}
                {task.status === "picked" && (
                  <div className="glass-teal space-y-4 rounded-[24px] p-5">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <label className="inline-flex min-h-[48px] cursor-pointer items-center gap-2 rounded-full bg-white px-5 py-2.5 text-xs font-bold text-ink shadow-sm">
                        <Camera className="h-4 w-4 text-teal-700" aria-hidden="true" />
                        <span>{task.proofDataUrl ? "Proof Photo Attached" : "Upload Delivery Proof Photo"}</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="sr-only"
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) void handleProofUpload(task.id, f);
                          }}
                        />
                      </label>

                      <label className="flex min-h-[48px] cursor-pointer items-center gap-2 rounded-full bg-white/80 px-4 text-xs font-bold text-ink">
                        <input
                          type="checkbox"
                          checked={confirmed}
                          onChange={(e) =>
                            setReceiverConfirmedMap((prev) => ({
                              ...prev,
                              [task.id]: e.target.checked,
                            }))
                          }
                          className="h-5 w-5 accent-teal"
                        />
                        <span>Receiver tapped handoff confirmation</span>
                      </label>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        updateTaskStatus(task.id, "delivered", task.proofDataUrl, confirmed);
                        fireDeliveryConfetti();
                        setNotice(
                          `Delivered to ${task.receiverName}! Impact calculated & added to Impact Dashboard.`
                        );
                      }}
                      className="inline-flex min-h-[54px] w-full items-center justify-center gap-2 rounded-full bg-tangerine px-6 text-base font-bold text-white shadow-lg hover:bg-tangerine-700"
                    >
                      <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
                      <span>Complete Delivery & Celebrate</span>
                    </button>
                  </div>
                )}

                {task.status === "delivered" && (
                  <div className="glass-berry flex items-center justify-between rounded-[22px] p-4 text-sm font-bold text-ink">
                    <span>Delivered & counted! Thank you for rescuing {task.portions} meals.</span>
                    <span className="rounded-full bg-berry px-3 py-1 text-xs text-white">
                      Hero Badge +1
                    </span>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}

