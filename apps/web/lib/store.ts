"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { rankReceiversLocal, type ReceiverOrg } from "./matching";
import {
  calculateImpactLocal,
  type PackagingType,
  type SafetyDecision,
  type StorageMethod,
} from "./safety";

export type UserRole = "donor" | "receiver" | "volunteer" | "admin";

export interface ProfileState {
  id: string;
  role: UserRole;
  name: string;
  phoneMasked: string;
  orgName: string;
  verified: boolean;
  docType?: "fssai" | "ngo_registration" | "volunteer_id";
  docName?: string;
  verificationStatus: "unsubmitted" | "pending" | "approved" | "rejected";
  trustScore: number;
  optInLeaderboard: boolean;
}

export interface SurplusListing {
  id: string;
  donorName: string;
  title: string;
  category: string;
  items: string[];
  veg: boolean;
  portions: number;
  kg: number;
  allergens: string[];
  packaging: PackagingType;
  storageMethod: StorageMethod;
  preparedAt: string;
  safeBy: string;
  safetyDecision: SafetyDecision;
  safetyExplanation: string;
  pickupArea: string;
  pickupAddressExact: string;
  lat: number;
  lon: number;
  photoDataUrl?: string;
  status: "open" | "matched" | "picked" | "delivered" | "expired" | "blocked";
  synced: boolean;
  declinedReceiverIds: string[];
  matchRadiusKm: number;
  acceptedReceiverName?: string;
  acceptedReceiverId?: string;
  createdAt: string;
}

export interface VolunteerTask {
  id: string;
  listingId: string;
  listingTitle: string;
  donorName: string;
  receiverName: string;
  pickupArea: string;
  pickupAddressExact: string;
  dropArea: string;
  portions: number;
  safeBy: string;
  pickupLat: number;
  pickupLon: number;
  dropLat: number;
  dropLon: number;
  volunteerId: string | null;
  volunteerName: string;
  etaMinutes: number;
  distanceKm: number;
  status: "unassigned" | "accepted" | "picked" | "delivered";
  fallbackMode: "volunteer" | "receiver_self_pickup";
  proofDataUrl?: string;
  receiverConfirmed: boolean;
  pickedAt?: string;
  deliveredAt?: string;
}

export interface VerificationRequest {
  id: string;
  profileName: string;
  orgName: string;
  role: UserRole;
  docType: "fssai" | "ngo_registration" | "volunteer_id";
  docName: string;
  status: "pending" | "approved" | "rejected";
  submittedAt: string;
}

export interface ModerationFlag {
  id: string;
  listingId: string;
  listingTitle: string;
  reason: string;
  reporterRole: UserRole;
  status: "open" | "resolved" | "dismissed";
  createdAt: string;
}

export interface ImpactRecord {
  id: string;
  listingId: string;
  donorName: string;
  receiverName: string;
  title: string;
  meals: number;
  kg: number;
  co2eKg: number;
  valueInr: number;
  deliveredAt: string;
}

interface AppState {
  profile: ProfileState | null;
  listings: SurplusListing[];
  offlineQueue: SurplusListing[];
  receivers: ReceiverOrg[];
  tasks: VolunteerTask[];
  verifications: VerificationRequest[];
  flags: ModerationFlag[];
  impactRecords: ImpactRecord[];
  setProfile: (profile: ProfileState) => void;
  submitVerification: (
    docType: "fssai" | "ngo_registration" | "volunteer_id",
    docName: string
  ) => void;
  addListing: (listing: SurplusListing) => void;
  queueOfflineListing: (listing: SurplusListing) => void;
  flushOfflineQueue: () => number;
  acceptMatch: (listingId: string, receiverId?: string) => void;
  declineMatch: (listingId: string, receiverId: string) => { widenedToKm: number; declines: number };
  updateTaskStatus: (
    taskId: string,
    status: VolunteerTask["status"],
    proofDataUrl?: string,
    receiverConfirmed?: boolean
  ) => void;
  simulateVolunteerStall: (taskId: string) => string;
  reviewVerification: (id: string, decision: "approved" | "rejected") => void;
  resolveBlockedOrFlag: (
    id: string,
    kind: "listing" | "flag",
    action: "approve" | "keep_blocked" | "resolve"
  ) => void;
  flagListing: (listingId: string, reason: string) => void;
  exportUserData: () => string;
  deleteAccount: () => void;
}

const nowIso = () => new Date().toISOString();
const plusMinsIso = (mins: number) => new Date(Date.now() + mins * 60000).toISOString();
const minusMinsIso = (mins: number) => new Date(Date.now() - mins * 60000).toISOString();

const SEED_RECEIVERS: ReceiverOrg[] = [
  {
    id: "ngo-asha",
    orgName: "Asha Community Kitchen",
    area: "Paldi, Ahmedabad",
    lat: 23.012,
    lon: 72.565,
    dailyDemandPortions: 120,
    rescuedTodayPortions: 30,
    maxSinglePickupPortions: 80,
    dietaryPreference: "veg_only",
    isOpenNow: true,
    hoursSinceLastRescue: 18,
    verified: true,
  },
  {
    id: "ngo-seva",
    orgName: "Seva Night Shelter",
    area: "Ellisbridge, Ahmedabad",
    lat: 23.025,
    lon: 72.573,
    dailyDemandPortions: 90,
    rescuedTodayPortions: 15,
    maxSinglePickupPortions: 60,
    dietaryPreference: "any",
    isOpenNow: true,
    hoursSinceLastRescue: 24,
    verified: true,
  },
  {
    id: "ngo-navjivan",
    orgName: "Navjivan Old Age Home",
    area: "Naranpura, Ahmedabad",
    lat: 23.052,
    lon: 72.556,
    dailyDemandPortions: 60,
    rescuedTodayPortions: 10,
    maxSinglePickupPortions: 35,
    dietaryPreference: "veg_only",
    isOpenNow: true,
    hoursSinceLastRescue: 12,
    verified: true,
  },
  {
    id: "ngo-sabarmati",
    orgName: "Sabarmati Bal Ashram",
    area: "Sabarmati, Ahmedabad",
    lat: 23.076,
    lon: 72.584,
    dailyDemandPortions: 140,
    rescuedTodayPortions: 40,
    maxSinglePickupPortions: 100,
    dietaryPreference: "any",
    isOpenNow: true,
    hoursSinceLastRescue: 9,
    verified: true,
  },
];

const SEED_LISTINGS: SurplusListing[] = [
  {
    id: "lst-seed-1",
    donorName: "Spice Hub Kitchen",
    title: "Veg Biryani & Boondi Raita",
    category: "cooked_rice_dish",
    items: ["veg biryani", "boondi raita"],
    veg: true,
    portions: 40,
    kg: 14,
    allergens: ["dairy"],
    packaging: "sealed_containers",
    storageMethod: "ambient",
    preparedAt: minusMinsIso(25),
    safeBy: plusMinsIso(95),
    safetyDecision: "APPROVE",
    safetyExplanation: "Safe to rescue for 95 more minutes. Cooked rice must be delivered within 2 hours.",
    pickupArea: "Navrangpura, Ahmedabad",
    pickupAddressExact: "42 CG Road, Near Municipal Market, Navrangpura",
    lat: 23.0365,
    lon: 72.5611,
    status: "open",
    synced: true,
    declinedReceiverIds: [],
    matchRadiusKm: 5,
    createdAt: nowIso(),
  },
  {
    id: "lst-seed-2",
    donorName: "Utsav Banquet Hall",
    title: "Dal Tadka & Tandoori Roti",
    category: "cooked_curry_dal",
    items: ["dal tadka", "tandoori roti"],
    veg: true,
    portions: 65,
    kg: 20.8,
    allergens: ["gluten"],
    packaging: "covered_trays",
    storageMethod: "ambient",
    preparedAt: minusMinsIso(115),
    safeBy: plusMinsIso(38),
    safetyDecision: "APPROVE_WITH_WARNING",
    safetyExplanation: "Approved with urgency: 38 minutes left to deliver.",
    pickupArea: "Satellite, Ahmedabad",
    pickupAddressExact: "18 Judges Bungalow Road, Satellite",
    lat: 23.0285,
    lon: 72.5235,
    status: "matched",
    synced: true,
    declinedReceiverIds: [],
    matchRadiusKm: 5,
    acceptedReceiverId: "ngo-asha",
    acceptedReceiverName: "Asha Community Kitchen",
    createdAt: nowIso(),
  },
  {
    id: "lst-seed-3",
    donorName: "Gokul Mithai House",
    title: "Kaju Barfi & Milk Peda",
    category: "dairy_sweets",
    items: ["kaju barfi", "milk peda"],
    veg: true,
    portions: 30,
    kg: 5.4,
    allergens: ["dairy", "tree_nuts"],
    packaging: "sealed_containers",
    storageMethod: "chilled",
    preparedAt: minusMinsIso(60),
    safeBy: plusMinsIso(1380),
    safetyDecision: "APPROVE",
    safetyExplanation: "Chilled dairy sweets safe for 23 hours.",
    pickupArea: "Bodakdev, Ahmedabad",
    pickupAddressExact: "9 Sindhu Bhavan Marg, Bodakdev",
    lat: 23.0387,
    lon: 72.5078,
    status: "delivered",
    synced: true,
    declinedReceiverIds: [],
    matchRadiusKm: 5,
    acceptedReceiverId: "ngo-seva",
    acceptedReceiverName: "Seva Night Shelter",
    createdAt: nowIso(),
  },
  {
    id: "lst-seed-4",
    donorName: "Kankaria Event Caterers",
    title: "Cut Melon & Pineapple Bowls (Expired Test)",
    category: "cut_fruit_salad",
    items: ["cut melon", "pineapple"],
    veg: true,
    portions: 25,
    kg: 6.25,
    allergens: [],
    packaging: "open_unsealed",
    storageMethod: "ambient",
    preparedAt: minusMinsIso(140),
    safeBy: minusMinsIso(20),
    safetyDecision: "BLOCK",
    safetyExplanation: "Cut fruit exceeded its 2-hour ambient window and was automatically blocked.",
    pickupArea: "Maninagar, Ahmedabad",
    pickupAddressExact: "14 Rambagh Circle, Maninagar",
    lat: 22.9961,
    lon: 72.6034,
    status: "blocked",
    synced: true,
    declinedReceiverIds: [],
    matchRadiusKm: 5,
    createdAt: nowIso(),
  },
];

const SEED_TASKS: VolunteerTask[] = [
  {
    id: "tsk-seed-1",
    listingId: "lst-seed-2",
    listingTitle: "Dal Tadka & Tandoori Roti",
    donorName: "Utsav Banquet Hall",
    receiverName: "Asha Community Kitchen",
    pickupArea: "Satellite, Ahmedabad",
    pickupAddressExact: "18 Judges Bungalow Road, Satellite",
    dropArea: "Paldi, Ahmedabad",
    portions: 65,
    safeBy: plusMinsIso(38),
    pickupLat: 23.0285,
    pickupLon: 72.5235,
    dropLat: 23.012,
    dropLon: 72.565,
    volunteerId: "vol-riya",
    volunteerName: "Riya Shah",
    etaMinutes: 16,
    distanceKm: 4.8,
    status: "accepted",
    fallbackMode: "volunteer",
    receiverConfirmed: false,
  },
];

const SEED_VERIFICATIONS: VerificationRequest[] = [
  {
    id: "ver-1",
    profileName: "Meera Desai",
    orgName: "Annapurna Community Trust",
    role: "receiver",
    docType: "ngo_registration",
    docName: "NGO-REG-AHM-2026.pdf",
    status: "pending",
    submittedAt: minusMinsIso(90),
  },
  {
    id: "ver-2",
    profileName: "Kabir Mehta",
    orgName: "Student Rider Volunteer",
    role: "volunteer",
    docType: "volunteer_id",
    docName: "DL-GJ01-8891.jpg",
    status: "pending",
    submittedAt: minusMinsIso(45),
  },
];

const SEED_IMPACT: ImpactRecord[] = [
  {
    id: "imp-1",
    listingId: "lst-seed-3",
    donorName: "Gokul Mithai House",
    receiverName: "Seva Night Shelter",
    title: "Kaju Barfi & Milk Peda",
    meals: 30,
    kg: 5.4,
    co2eKg: 18.36,
    valueInr: 1800,
    deliveredAt: minusMinsIso(30),
  },
  {
    id: "imp-2",
    listingId: "lst-hist-1",
    donorName: "Spice Hub Kitchen",
    receiverName: "Asha Community Kitchen",
    title: "Gujarati Thali Surplus",
    meals: 85,
    kg: 27.2,
    co2eKg: 57.12,
    valueInr: 4250,
    deliveredAt: minusMinsIso(480),
  },
  {
    id: "imp-3",
    listingId: "lst-hist-2",
    donorName: "Utsav Banquet Hall",
    receiverName: "Sabarmati Bal Ashram",
    title: "Pulao & Paneer Sabzi",
    meals: 110,
    kg: 38.5,
    co2eKg: 103.95,
    valueInr: 4950,
    deliveredAt: minusMinsIso(1440),
  },
];

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      profile: {
        id: "demo-donor-1",
        role: "donor",
        name: "Aarav Patel",
        phoneMasked: "+91 ••••••4210",
        orgName: "Spice Hub Kitchen",
        verified: true,
        docType: "fssai",
        docName: "FSSAI-GJ-2026.pdf",
        verificationStatus: "approved",
        trustScore: 4.9,
        optInLeaderboard: true,
      },
      listings: SEED_LISTINGS,
      offlineQueue: [],
      receivers: SEED_RECEIVERS,
      tasks: SEED_TASKS,
      verifications: SEED_VERIFICATIONS,
      flags: [
        {
          id: "flg-1",
          listingId: "lst-seed-4",
          listingTitle: "Cut Melon & Pineapple Bowls",
          reason: "Prepared over 2 hours ago in ambient heat",
          reporterRole: "admin",
          status: "open",
          createdAt: minusMinsIso(15),
        },
      ],
      impactRecords: SEED_IMPACT,

      setProfile: (profile) => set({ profile }),

      submitVerification: (docType, docName) =>
        set((state) => ({
          profile: state.profile
            ? {
                ...state.profile,
                docType,
                docName,
                verificationStatus: "pending",
              }
            : null,
          verifications: [
            {
              id: `ver-${Date.now()}`,
              profileName: state.profile?.name || "Partner",
              orgName: state.profile?.orgName || "Ahmedabad Org",
              role: state.profile?.role || "donor",
              docType,
              docName,
              status: "pending",
              submittedAt: nowIso(),
            },
            ...state.verifications,
          ],
        })),

      addListing: (listing) =>
        set((state) => ({
          listings: [listing, ...state.listings],
        })),

      queueOfflineListing: (listing) =>
        set((state) => ({
          offlineQueue: [listing, ...state.offlineQueue],
        })),

      flushOfflineQueue: () => {
        const queued = get().offlineQueue;
        if (queued.length === 0) return 0;
        const syncedItems = queued.map((item) => ({ ...item, synced: true }));
        set((state) => ({
          listings: [...syncedItems, ...state.listings],
          offlineQueue: [],
        }));
        return syncedItems.length;
      },

      acceptMatch: (listingId, receiverId) => {
        const state = get();
        const listing = state.listings.find((l) => l.id === listingId);
        if (!listing || listing.status !== "open") return;

        const ranked = rankReceiversLocal({
          listingLat: listing.lat,
          listingLon: listing.lon,
          portions: listing.portions,
          veg: listing.veg,
          safeByIso: listing.safeBy,
          maxRadiusKm: listing.matchRadiusKm,
          receivers: state.receivers,
          declinedIds: listing.declinedReceiverIds,
        });

        const chosenReceiver =
          state.receivers.find((r) => r.id === receiverId) ??
          state.receivers.find((r) => r.id === ranked.matches[0]?.receiverId) ??
          state.receivers[0];

        const newTask: VolunteerTask = {
          id: `tsk-${Date.now()}`,
          listingId: listing.id,
          listingTitle: listing.title,
          donorName: listing.donorName,
          receiverName: chosenReceiver.orgName,
          pickupArea: listing.pickupArea,
          pickupAddressExact: listing.pickupAddressExact,
          dropArea: chosenReceiver.area,
          portions: listing.portions,
          safeBy: listing.safeBy,
          pickupLat: listing.lat,
          pickupLon: listing.lon,
          dropLat: chosenReceiver.lat,
          dropLon: chosenReceiver.lon,
          volunteerId: "vol-riya",
          volunteerName: "Riya Shah",
          etaMinutes: Math.max(10, ranked.matches[0]?.estimatedTravelMinutes ?? 15),
          distanceKm: ranked.matches[0]?.distanceKm ?? 3.4,
          status: "accepted",
          fallbackMode: "volunteer",
          receiverConfirmed: false,
        };

        set((prev) => ({
          listings: prev.listings.map((l) =>
            l.id === listingId
              ? {
                  ...l,
                  status: "matched",
                  acceptedReceiverId: chosenReceiver.id,
                  acceptedReceiverName: chosenReceiver.orgName,
                }
              : l
          ),
          tasks: [newTask, ...prev.tasks],
        }));
      },

      declineMatch: (listingId, receiverId) => {
        const listing = get().listings.find((l) => l.id === listingId);
        if (!listing) return { widenedToKm: 5, declines: 0 };

        const updatedDeclines = Array.from(
          new Set([...listing.declinedReceiverIds, receiverId])
        );
        // After 3 declines, widen radius from 5 km -> 10 km -> 15 km
        const widenedToKm = updatedDeclines.length >= 3 ? Math.min(15, listing.matchRadiusKm + 5) : listing.matchRadiusKm;

        set((state) => ({
          listings: state.listings.map((l) =>
            l.id === listingId
              ? {
                  ...l,
                  declinedReceiverIds: updatedDeclines,
                  matchRadiusKm: widenedToKm,
                }
              : l
          ),
        }));

        return { widenedToKm, declines: updatedDeclines.length };
      },

      updateTaskStatus: (taskId, status, proofDataUrl, receiverConfirmed) => {
        const state = get();
        const task = state.tasks.find((t) => t.id === taskId);
        if (!task) return;
        const listing = state.listings.find((l) => l.id === task.listingId);

        const now = nowIso();
        set((prev) => ({
          tasks: prev.tasks.map((t) =>
            t.id === taskId
              ? {
                  ...t,
                  status,
                  proofDataUrl: proofDataUrl ?? t.proofDataUrl,
                  receiverConfirmed: receiverConfirmed ?? t.receiverConfirmed,
                  pickedAt: status === "picked" ? now : t.pickedAt,
                  deliveredAt: status === "delivered" ? now : t.deliveredAt,
                }
              : t
          ),
          listings: prev.listings.map((l) =>
            l.id === task.listingId
              ? {
                  ...l,
                  status:
                    status === "picked"
                      ? "picked"
                      : status === "delivered"
                      ? "delivered"
                      : l.status,
                }
              : l
          ),
        }));

        if (status === "delivered" && listing && !state.impactRecords.some((i) => i.listingId === listing.id)) {
          const calc = calculateImpactLocal(listing.category, listing.portions);
          set((prev) => ({
            impactRecords: [
              {
                id: `imp-${Date.now()}`,
                listingId: listing.id,
                donorName: listing.donorName,
                receiverName: task.receiverName,
                title: listing.title,
                meals: calc.meals,
                kg: calc.kg,
                co2eKg: calc.co2e_kg,
                valueInr: calc.value_inr,
                deliveredAt: now,
              },
              ...prev.impactRecords,
            ],
            receivers: prev.receivers.map((r) =>
              r.orgName === task.receiverName
                ? {
                    ...r,
                    rescuedTodayPortions: r.rescuedTodayPortions + listing.portions,
                    hoursSinceLastRescue: 0,
                  }
                : r
            ),
          }));
        }
      },

      simulateVolunteerStall: (taskId) => {
        const state = get();
        const task = state.tasks.find((t) => t.id === taskId);
        if (!task) return "Task not found";
        if (task.volunteerId === "vol-riya") {
          set((prev) => ({
            tasks: prev.tasks.map((t) =>
              t.id === taskId
                ? {
                    ...t,
                    volunteerId: "vol-kabir",
                    volunteerName: "Kabir Mehta (Reassigned)",
                    etaMinutes: 11,
                    fallbackMode: "volunteer",
                  }
                : t
            ),
          }));
          return "Rider stalled >10 min: reassigned to nearest rider Kabir Mehta (11 min ETA).";
        }
        set((prev) => ({
          tasks: prev.tasks.map((t) =>
            t.id === taskId
              ? {
                  ...t,
                  volunteerId: null,
                  volunteerName: "Receiver Self-Pickup",
                  fallbackMode: "receiver_self_pickup",
                }
              : t
          ),
        }));
        return "No alternate volunteer available: switched to Receiver Self-Pickup fallback.";
      },

      reviewVerification: (id, decision) =>
        set((state) => ({
          verifications: state.verifications.map((v) =>
            v.id === id ? { ...v, status: decision } : v
          ),
        })),

      resolveBlockedOrFlag: (id, kind, action) =>
        set((state) => {
          if (kind === "listing") {
            return {
              listings: state.listings.map((l) =>
                l.id === id
                  ? {
                      ...l,
                      status: action === "approve" ? "open" : "blocked",
                      safetyDecision: action === "approve" ? "APPROVE_WITH_WARNING" : "BLOCK",
                    }
                  : l
              ),
            };
          }
          return {
            flags: state.flags.map((f) =>
              f.id === id
                ? { ...f, status: action === "resolve" ? "resolved" : "dismissed" }
                : f
            ),
          };
        }),

      flagListing: (listingId, reason) =>
        set((state) => {
          const listing = state.listings.find((l) => l.id === listingId);
          return {
            flags: [
              {
                id: `flg-${Date.now()}`,
                listingId,
                listingTitle: listing?.title || "Listing",
                reason,
                reporterRole: state.profile?.role || "receiver",
                status: "open",
                createdAt: nowIso(),
              },
              ...state.flags,
            ],
            profile: state.profile
              ? {
                  ...state.profile,
                  trustScore: Math.max(0, Number((state.profile.trustScore - 0.3).toFixed(2))),
                }
              : null,
          };
        }),

      exportUserData: () => {
        const s = get();
        return JSON.stringify(
          {
            exportedAt: nowIso(),
            profile: s.profile,
            listings: s.listings,
            tasks: s.tasks,
            impactRecords: s.impactRecords,
          },
          null,
          2
        );
      },

      deleteAccount: () =>
        set({
          profile: null,
          offlineQueue: [],
        }),
    }),
    {
      name: "foodrescue-v1-store",
    }
  )
);
