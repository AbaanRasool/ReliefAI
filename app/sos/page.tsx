"use client";

import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, Loader2, Upload } from "lucide-react";

import { useDisaster } from "@/context/DisasterContext";
import type { DisasterType } from "@/data/disasters";

type SosReport = {
  id: string;
  createdAtISO: string;
  disasterType: DisasterType;
  name: string;
  location: string;
  emergencyType: string;
  peopleAffected: number;
  trapped: boolean;
  description: string;
  photoFilename: string | null;
};

type SuccessState = {
  reference: string;
  hospitalName: string;
  eta: string;
};

const STORAGE_KEY = "reliefai:sosReports";

function parseDistanceKm(distance: string): number | null {
  const match = /(\d+(\.\d+)?)\s*km/i.exec(distance);
  return match ? Number(match[1]) : null;
}

function pickNearestHospital(
  hospitals: readonly { name: string; distance: string; status: string; eta: string }[]
) {
  const scored = hospitals
    .map((h) => ({ ...h, km: parseDistanceKm(h.distance) }))
    .filter((h) => typeof h.km === "number" && Number.isFinite(h.km)) as Array<
    { name: string; distance: string; status: string; eta: string; km: number }
  >;

  const available = scored.filter((h) => h.status === "AVAILABLE").sort((a, b) => a.km - b.km)[0];
  if (available) return { hospitalName: available.name, eta: available.eta };

  const fallback = scored
    .filter((h) => h.status !== "INACCESSIBLE")
    .sort((a, b) => a.km - b.km)[0];
  if (fallback) return { hospitalName: fallback.name, eta: fallback.eta };

  return { hospitalName: "N/A", eta: "N/A" };
}

function safeReadReports(): SosReport[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as SosReport[]) : [];
  } catch {
    return [];
  }
}

function safeWriteReports(next: SosReport[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // ignore quota / private mode
  }
}

export default function SosPage() {
  const { disaster, disasterType } = useDisaster();

  const emergencyOptions = useMemo(
    () => disaster.triageInjuries as readonly string[],
    [disaster.triageInjuries]
  );

  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [emergencyType, setEmergencyType] = useState<string>(emergencyOptions[0] ?? "");
  const [peopleAffected, setPeopleAffected] = useState<number>(1);
  const [trapped, setTrapped] = useState<boolean>(false);
  const [description, setDescription] = useState("");
  const [photoFilename, setPhotoFilename] = useState<string | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<SuccessState | null>(null);

  const selectedEmergencyType = emergencyOptions.includes(emergencyType)
    ? emergencyType
    : (emergencyOptions[0] ?? "");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;

    setSubmitting(true);
    setSuccess(null);

    await new Promise((r) => setTimeout(r, 1500));

    const reference = `SOS-${Math.floor(1000 + Math.random() * 9000)}`;
    const nowISO = new Date().toISOString();
    const report: SosReport = {
      id: reference,
      createdAtISO: nowISO,
      disasterType,
      name: name.trim(),
      location: location.trim(),
      emergencyType,
      peopleAffected: Number.isFinite(peopleAffected) ? peopleAffected : 1,
      trapped,
      description: description.trim(),
      photoFilename,
    };

    const prev = safeReadReports();
    safeWriteReports([report, ...prev]);

    const nearest = pickNearestHospital(disaster.hospitals);
    setSuccess({ reference, ...nearest });
    setSubmitting(false);
  }

  const disabled = submitting || !!success;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="flex flex-1 flex-col bg-black"
    >
      <div className="mx-auto w-full max-w-2xl px-4 sm:px-6 py-8">
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">Send SOS</h1>
          <p className="mt-1 text-sm text-gray-400">
            Report an emergency for <span className="text-gray-200 font-semibold">{disaster.name}</span>.
          </p>
        </div>

        {success ? (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="rounded-xl bg-gray-950/70 ring-1 ring-white/10 p-5"
          >
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-full bg-emerald-500/15 ring-1 ring-emerald-500/30 flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5 text-emerald-400" aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <div className="text-white font-semibold">
                  SOS Received — Priority: <span className="text-red-400">CRITICAL</span> — Help dispatched.
                </div>
                <div className="mt-1 text-sm text-gray-300">
                  Reference: <span className="font-mono text-gray-100">{success.reference}</span>
                </div>
                <div className="mt-4 rounded-lg bg-white/5 ring-1 ring-white/10 p-4">
                  <div className="text-sm font-semibold text-white">Estimated response time</div>
                  <div className="mt-1 text-sm text-gray-300">
                    Nearest hospital: <span className="text-gray-100 font-semibold">{success.hospitalName}</span>
                    <span className="text-gray-500"> • </span>
                    ETA <span className="text-gray-100 font-semibold">{success.eta}</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.form
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            onSubmit={onSubmit}
            className="rounded-xl bg-gray-950/70 ring-1 ring-white/10 p-5 space-y-4"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="grid gap-2">
                <span className="text-sm font-semibold text-gray-200">Name</span>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={disabled}
                  required
                  className="h-11 rounded-lg bg-black/40 ring-1 ring-white/10 px-3 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-red-600/60"
                  placeholder="Your name"
                />
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-semibold text-gray-200">Location</span>
                <input
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  disabled={disabled}
                  required
                  className="h-11 rounded-lg bg-black/40 ring-1 ring-white/10 px-3 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-red-600/60"
                  placeholder="e.g. Near Lal Chowk, Rajbagh"
                />
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="grid gap-2">
                <span className="text-sm font-semibold text-gray-200">Emergency type</span>
                <select
                  value={selectedEmergencyType}
                  onChange={(e) => setEmergencyType(e.target.value)}
                  disabled={disabled}
                  className="h-11 rounded-lg bg-black/40 ring-1 ring-white/10 px-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-red-600/60"
                >
                  {emergencyOptions.map((opt) => (
                    <option key={opt} value={opt} className="bg-black">
                      {opt}
                    </option>
                  ))}
                </select>
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-semibold text-gray-200">Number of people affected</span>
                <input
                  type="number"
                  min={1}
                  value={peopleAffected}
                  onChange={(e) => setPeopleAffected(Number(e.target.value))}
                  disabled={disabled}
                  required
                  className="h-11 rounded-lg bg-black/40 ring-1 ring-white/10 px-3 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-red-600/60"
                />
              </label>
            </div>

            <div className="grid gap-2">
              <span className="text-sm font-semibold text-gray-200">Are you trapped?</span>
              <div className="inline-flex rounded-lg bg-black/40 ring-1 ring-white/10 p-1 w-fit">
                <button
                  type="button"
                  onClick={() => setTrapped(false)}
                  disabled={disabled}
                  className={[
                    "px-4 py-2 rounded-md text-sm font-semibold transition-colors",
                    trapped ? "text-gray-300 hover:bg-white/5" : "bg-white/10 text-white",
                  ].join(" ")}
                >
                  No
                </button>
                <button
                  type="button"
                  onClick={() => setTrapped(true)}
                  disabled={disabled}
                  className={[
                    "px-4 py-2 rounded-md text-sm font-semibold transition-colors",
                    trapped ? "bg-red-600/30 text-white" : "text-gray-300 hover:bg-white/5",
                  ].join(" ")}
                >
                  Yes
                </button>
              </div>
            </div>

            <label className="grid gap-2">
              <span className="text-sm font-semibold text-gray-200">Description</span>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={disabled}
                rows={4}
                className="rounded-lg bg-black/40 ring-1 ring-white/10 px-3 py-2 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-red-600/60"
                placeholder="Describe the situation, injuries, and immediate needs..."
              />
            </label>

            <div className="grid gap-2">
              <span className="text-sm font-semibold text-gray-200">Photo upload</span>
              <label className="flex items-center justify-between gap-3 rounded-lg bg-black/40 ring-1 ring-white/10 px-3 py-3 cursor-pointer hover:bg-white/5 transition-colors">
                <div className="min-w-0">
                  <div className="text-sm text-white font-semibold flex items-center gap-2">
                    <Upload className="h-4 w-4 text-gray-300" aria-hidden="true" />
                    Upload photo
                  </div>
                  <div className="text-xs text-gray-500 truncate">
                    {photoFilename ? photoFilename : "UI only — no backend upload yet"}
                  </div>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  disabled={disabled}
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0] ?? null;
                    setPhotoFilename(file ? file.name : null);
                  }}
                />
              </label>
            </div>

            <button
              type="submit"
              disabled={disabled || !name.trim() || !location.trim() || !emergencyType}
              className="w-full h-12 rounded-xl bg-red-600 hover:bg-red-500 transition-colors text-white font-extrabold tracking-wide ring-1 ring-red-500/30 disabled:opacity-60 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
                  Sending…
                </>
              ) : (
                "SEND SOS"
              )}
            </button>
          </motion.form>
        )}
      </div>
    </motion.div>
  );
}

