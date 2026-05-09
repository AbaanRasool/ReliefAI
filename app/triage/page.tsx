"use client";

import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, Loader2, Send } from "lucide-react";

import { useDisaster } from "@/context/DisasterContext";

type TriagePriority = "CRITICAL" | "HIGH" | "MEDIUM" | "STABLE";

type TriageResult = {
  priority: TriagePriority;
  reason: string;
  first_aid: [string, string, string] | string[];
  rescue_needed: boolean;
  hospital_needed: boolean;
  do_not_move: boolean;
};

type AlertModalState = { open: boolean; hospitalName: string | null };

function priorityBadgeClass(priority: TriagePriority) {
  switch (priority) {
    case "CRITICAL":
      return "bg-red-600 text-white ring-red-500/40";
    case "HIGH":
      return "bg-orange-500 text-black ring-orange-400/40";
    case "MEDIUM":
      return "bg-yellow-400 text-black ring-yellow-300/40";
    case "STABLE":
      return "bg-emerald-500 text-black ring-emerald-400/40";
  }
}

function parseDistanceKm(distance: string): number | null {
  const match = /(\d+(\.\d+)?)\s*km/i.exec(distance);
  return match ? Number(match[1]) : null;
}

function pickNearestAvailableHospital(
  hospitals: readonly { name: string; distance: string; status: string; eta: string }[]
) {
  const scored = hospitals
    .map((h) => ({ ...h, km: parseDistanceKm(h.distance) }))
    .filter((h) => typeof h.km === "number" && Number.isFinite(h.km)) as Array<
    { name: string; distance: string; status: string; eta: string; km: number }
  >;

  const available = scored.filter((h) => h.status === "AVAILABLE").sort((a, b) => a.km - b.km)[0];
  if (available) return available;

  const fallback = scored
    .filter((h) => h.status !== "INACCESSIBLE")
    .sort((a, b) => a.km - b.km)[0];
  return fallback ?? null;
}

export default function TriagePage() {
  const { disaster, disasterType } = useDisaster();

  const injuryOptions = useMemo(
    () => disaster.triageInjuries as readonly string[],
    [disaster.triageInjuries]
  );

  const [patientName, setPatientName] = useState("");
  const [age, setAge] = useState<number>(0);
  const [injuryType, setInjuryType] = useState<string>(injuryOptions[0] ?? "");
  const [symptoms, setSymptoms] = useState("");
  const [trappedUnderDebris, setTrappedUnderDebris] = useState(false);
  const [unstableStructureNearby, setUnstableStructureNearby] = useState(false);
  const [bloodPressure, setBloodPressure] = useState("");
  const [pulse, setPulse] = useState<string>("");

  const selectedInjuryType = injuryOptions.includes(injuryType) ? injuryType : (injuryOptions[0] ?? "");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<TriageResult | null>(null);
  const [modal, setModal] = useState<AlertModalState>({ open: false, hospitalName: null });

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/triage", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          disasterType,
          patient_name: patientName.trim(),
          age,
          injury_type: selectedInjuryType,
          symptoms: symptoms.trim(),
          trapped_under_debris: disasterType === "earthquake" ? trappedUnderDebris : false,
          unstable_structure_nearby: unstableStructureNearby,
          vitals: {
            blood_pressure: bloodPressure.trim() || null,
            pulse: pulse.trim() ? Number(pulse) : null,
          },
        }),
      });

      const data: unknown = await res.json().catch(() => null);
      if (!res.ok) {
        const msg =
          data && typeof data === "object" && "error" in data && typeof (data as { error?: unknown }).error === "string"
            ? (data as { error: string }).error
            : `Request failed (${res.status})`;
        throw new Error(msg);
      }

      if (!data || typeof data !== "object") {
        throw new Error("Malformed response from /api/triage");
      }

      setResult(data as TriageResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to run AI triage");
    } finally {
      setLoading(false);
    }
  }

  const disabled = loading;

  const nearestHospital = useMemo(
    () => pickNearestAvailableHospital(disaster.hospitals),
    [disaster.hospitals]
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="flex flex-1 flex-col bg-black"
    >
      <div className="mx-auto w-full max-w-3xl px-4 sm:px-6 py-8 space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">AI Triage</h1>
          <p className="mt-1 text-sm text-gray-400">
            Grok-powered triage guidance for <span className="text-gray-200 font-semibold">{disaster.name}</span>.
          </p>
        </div>

        <motion.form
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          onSubmit={onSubmit}
          className="rounded-xl bg-gray-950/70 ring-1 ring-white/10 p-5 space-y-4"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="grid gap-2">
              <span className="text-sm font-semibold text-gray-200">Patient name</span>
              <input
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
                disabled={disabled}
                required
                className="h-11 rounded-lg bg-black/40 ring-1 ring-white/10 px-3 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-red-600/60"
                placeholder="Full name"
              />
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-semibold text-gray-200">Age</span>
              <input
                type="number"
                min={0}
                value={age}
                onChange={(e) => setAge(Number(e.target.value))}
                disabled={disabled}
                required
                className="h-11 rounded-lg bg-black/40 ring-1 ring-white/10 px-3 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-red-600/60"
              />
            </label>
          </div>

          <label className="grid gap-2">
            <span className="text-sm font-semibold text-gray-200">Injury type</span>
            <select
              value={selectedInjuryType}
              onChange={(e) => setInjuryType(e.target.value)}
              disabled={disabled}
              className="h-11 rounded-lg bg-black/40 ring-1 ring-white/10 px-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-red-600/60"
            >
              {injuryOptions.map((opt) => (
                <option key={opt} value={opt} className="bg-black">
                  {opt}
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-2">
            <span className="text-sm font-semibold text-gray-200">Symptoms</span>
            <textarea
              value={symptoms}
              onChange={(e) => setSymptoms(e.target.value)}
              disabled={disabled}
              rows={6}
              required
              className="rounded-lg bg-black/40 ring-1 ring-white/10 px-3 py-2 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-red-600/60"
              placeholder="Describe symptoms in detail (pain, bleeding, consciousness, breathing, mobility, etc.)"
            />
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {disasterType === "earthquake" ? (
              <label className="flex items-center gap-3 rounded-lg bg-white/5 ring-1 ring-white/10 px-3 py-3">
                <input
                  type="checkbox"
                  checked={trappedUnderDebris}
                  onChange={(e) => setTrappedUnderDebris(e.target.checked)}
                  disabled={disabled}
                  className="h-4 w-4 accent-red-600"
                />
                <span className="text-sm text-gray-200 font-semibold">Trapped under debris</span>
              </label>
            ) : null}

            <label className="flex items-center gap-3 rounded-lg bg-white/5 ring-1 ring-white/10 px-3 py-3">
              <input
                type="checkbox"
                checked={unstableStructureNearby}
                onChange={(e) => setUnstableStructureNearby(e.target.checked)}
                disabled={disabled}
                className="h-4 w-4 accent-red-600"
              />
              <span className="text-sm text-gray-200 font-semibold">Unstable structure nearby</span>
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="grid gap-2">
              <span className="text-sm font-semibold text-gray-200">Blood Pressure (optional)</span>
              <input
                value={bloodPressure}
                onChange={(e) => setBloodPressure(e.target.value)}
                disabled={disabled}
                className="h-11 rounded-lg bg-black/40 ring-1 ring-white/10 px-3 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-red-600/60"
                placeholder="e.g. 120/80"
              />
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-semibold text-gray-200">Pulse (optional)</span>
              <input
                type="number"
                min={0}
                value={pulse}
                onChange={(e) => setPulse(e.target.value)}
                disabled={disabled}
                className="h-11 rounded-lg bg-black/40 ring-1 ring-white/10 px-3 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-red-600/60"
                placeholder="e.g. 96"
              />
            </label>
          </div>

          {error ? (
            <div className="rounded-lg bg-red-500/10 ring-1 ring-red-500/30 px-4 py-3 text-sm text-red-200">
              {error}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={disabled || !patientName.trim() || !symptoms.trim() || !selectedInjuryType}
            className="w-full h-12 rounded-xl bg-red-600 hover:bg-red-500 transition-colors text-white font-extrabold tracking-wide ring-1 ring-red-500/30 disabled:opacity-60 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
                Grok is thinking…
              </>
            ) : (
              <>
                <Send className="h-5 w-5" aria-hidden="true" />
                Run Triage
              </>
            )}
          </button>
        </motion.form>

        {result ? (
          <motion.section
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="rounded-xl bg-gray-950/70 ring-1 ring-white/10 overflow-hidden"
          >
            <div className="px-5 py-5 flex items-start justify-between gap-4 border-b border-white/10">
              <div className="min-w-0">
                <div className="text-xs uppercase tracking-wide text-gray-400">Triage result</div>
                <div className="mt-2 flex items-center gap-3">
                  <div
                    className={[
                      "px-4 py-2 rounded-xl text-xl sm:text-2xl font-extrabold ring-1",
                      priorityBadgeClass(result.priority),
                    ].join(" ")}
                  >
                    {result.priority}
                  </div>
                  <div className="text-sm text-gray-300">
                    {result.hospital_needed ? "Hospital evaluation recommended." : "Hospital may not be required."}
                  </div>
                </div>
              </div>
            </div>

            <div className="px-5 py-5 space-y-4">
              {result.do_not_move ? (
                <div className="rounded-xl bg-red-600/15 ring-1 ring-red-500/30 p-4 flex items-start gap-3">
                  <div className="h-10 w-10 rounded-full bg-red-600/20 ring-1 ring-red-500/30 flex items-center justify-center">
                    <AlertTriangle className="h-5 w-5 text-red-300" aria-hidden="true" />
                  </div>
                  <div>
                    <div className="text-white font-extrabold tracking-wide">
                      DO NOT MOVE — Possible spinal injury
                    </div>
                    <div className="mt-1 text-sm text-red-200">
                      Keep the patient still and stabilize head/neck if safe. Wait for trained rescue.
                    </div>
                  </div>
                </div>
              ) : null}

              <div>
                <div className="text-sm font-semibold text-gray-200">Reason</div>
                <p className="mt-2 text-sm leading-6 text-gray-200 whitespace-pre-line">{result.reason}</p>
              </div>

              <div>
                <div className="text-sm font-semibold text-gray-200">First aid (immediate)</div>
                <ol className="mt-2 space-y-2 list-decimal list-inside text-sm text-gray-200">
                  {(Array.isArray(result.first_aid) ? result.first_aid : [])
                    .slice(0, 3)
                    .map((step, idx) => (
                      <li key={`${idx}-${step}`} className="leading-6">
                        {step}
                      </li>
                    ))}
                </ol>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between">
                <div className="text-xs text-gray-500">
                  Rescue needed: <span className="text-gray-300 font-semibold">{String(result.rescue_needed)}</span>
                  <span className="text-gray-600"> • </span>
                  Hospital needed:{" "}
                  <span className="text-gray-300 font-semibold">{String(result.hospital_needed)}</span>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    const h = nearestHospital?.name ?? "Bone & Joint Hospital";
                    setModal({ open: true, hospitalName: h });
                  }}
                  className="inline-flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 transition-colors ring-1 ring-white/10 px-4 py-2 text-sm font-semibold text-white"
                >
                  Alert Nearest Hospital
                </button>
              </div>
            </div>
          </motion.section>
        ) : null}
      </div>

      {modal.open ? (
        <div className="fixed inset-0 z-[60]">
          <div
            className="absolute inset-0 bg-black/70"
            onClick={() => setModal({ open: false, hospitalName: null })}
          />
          <div className="absolute inset-x-0 top-24 mx-auto w-[92%] max-w-md">
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="rounded-xl bg-gray-950 ring-1 ring-white/10 shadow-xl p-5"
            >
              <div className="text-lg font-bold text-white">Hospital Alert</div>
              <p className="mt-2 text-sm text-gray-300">
                Alert sent to{" "}
                <span className="text-gray-100 font-semibold">
                  {modal.hospitalName ?? "Hospital"}
                </span>
                .
              </p>
              <div className="mt-5 flex justify-end">
                <button
                  type="button"
                  onClick={() => setModal({ open: false, hospitalName: null })}
                  className="rounded-lg bg-white/5 hover:bg-white/10 transition-colors ring-1 ring-white/10 px-4 py-2 text-sm font-semibold text-white"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        </div>
      ) : null}
    </motion.div>
  );
}

