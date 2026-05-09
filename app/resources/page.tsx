"use client";

import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, PackagePlus, Send, Users } from "lucide-react";

import { useDisaster } from "@/context/DisasterContext";

type Prediction = { resource: string; hoursRemaining: number; urgency: string };
type ResourcePredictResponse = { predictions: Prediction[]; recommendation: string };

type VolunteerStatus = "AVAILABLE" | "DEPLOYED" | "OFFLINE";
type Volunteer = {
  id: string;
  name: string;
  skill: string;
  task: string;
  location: string;
  status: VolunteerStatus;
};

function statusBadgeClass(status: string) {
  switch (status) {
    case "OK":
      return "bg-emerald-500/15 text-emerald-300 ring-emerald-500/30";
    case "WARNING":
      return "bg-yellow-500/15 text-yellow-200 ring-yellow-500/30";
    case "CRITICAL":
      return "bg-red-500/15 text-red-300 ring-red-500/30";
    default:
      return "bg-white/10 text-gray-200 ring-white/15";
  }
}

function barColorClass(percent: number) {
  if (percent > 60) return "bg-emerald-500";
  if (percent >= 30) return "bg-yellow-400";
  return "bg-red-500";
}

function volunteerStatusClass(status: VolunteerStatus) {
  switch (status) {
    case "AVAILABLE":
      return "bg-emerald-500/15 text-emerald-300 ring-emerald-500/30";
    case "DEPLOYED":
      return "bg-sky-500/15 text-sky-300 ring-sky-500/30";
    case "OFFLINE":
      return "bg-gray-500/15 text-gray-300 ring-gray-500/30";
  }
}

function buildVolunteers(disasterType: string): Volunteer[] {
  const base = [
    { id: "v1", name: "Aisha Khan", location: "Rajbagh", status: "DEPLOYED" as const },
    { id: "v2", name: "Omar Mir", location: "Lal Chowk", status: "AVAILABLE" as const },
    { id: "v3", name: "Neha Sharma", location: "Jawahar Nagar", status: "AVAILABLE" as const },
    { id: "v4", name: "Bilal Dar", location: "Bemina", status: "DEPLOYED" as const },
    { id: "v5", name: "Sana Iqbal", location: "Soura", status: "AVAILABLE" as const },
    { id: "v6", name: "Rohit Verma", location: "Nowgam", status: "OFFLINE" as const },
  ];

  const skillsByType: Record<string, { skills: string[]; tasks: string[] }> = {
    earthquake: {
      skills: ["Structural Rescue", "Medical", "K9 Handler", "Logistics", "Heavy Equipment", "Triage"],
      tasks: [
        "Rubble search & extraction",
        "Field triage support",
        "Perimeter safety checks",
        "Supply distribution",
        "Route clearing coordination",
        "Shelter setup",
      ],
    },
    flood: {
      skills: ["Boat Rescue", "Water Safety", "Medic", "Logistics", "Shelter Ops", "Sanitation"],
      tasks: [
        "Boat evacuation",
        "Water purifier deployment",
        "Camp medical support",
        "Food distribution",
        "Shelter management",
        "Sanitation setup",
      ],
    },
    fire: {
      skills: ["Evacuation", "Smoke Triage", "Fire Support", "Medic", "Logistics", "Traffic Control"],
      tasks: [
        "Evacuation routing",
        "Smoke exposure triage",
        "Perimeter safety",
        "Water tanker coordination",
        "Supply distribution",
        "Traffic control",
      ],
    },
    cyclone: {
      skills: ["Search & Rescue", "Medic", "Shelter Ops", "Comms", "Logistics", "Power Restoration"],
      tasks: [
        "Rescue coordination",
        "Medical camp support",
        "Shelter setup",
        "Radio comms relay",
        "Supply distribution",
        "Generator staging",
      ],
    },
    tsunami: {
      skills: ["Evacuation", "Medic", "Shelter Ops", "Logistics", "Water Safety", "Comms"],
      tasks: [
        "Inland evacuation",
        "Triage support",
        "Shelter operations",
        "Resupply routing",
        "Water safety patrol",
        "Comms relay",
      ],
    },
    drought: {
      skills: ["Medical", "Water Logistics", "Nutrition", "Shelter Ops", "Community Outreach", "Supply Chain"],
      tasks: [
        "Water tanker distribution",
        "ORS & IV support",
        "Cooling shelter setup",
        "Food packet distribution",
        "Village assessment",
        "Supply chain coordination",
      ],
    },
  };

  const spec = skillsByType[disasterType] ?? skillsByType.earthquake;
  return base.map((v, idx) => ({
    ...v,
    skill: spec.skills[idx % spec.skills.length],
    task: v.status === "AVAILABLE" ? "Awaiting assignment" : spec.tasks[idx % spec.tasks.length],
  }));
}

export default function ResourcesPage() {
  const { disaster, disasterType } = useDisaster();

  const [prediction, setPrediction] = useState<ResourcePredictResponse | null>(null);
  const [predictLoading, setPredictLoading] = useState(false);
  const [predictError, setPredictError] = useState<string | null>(null);

  const [volunteers, setVolunteers] = useState<Volunteer[]>(() => buildVolunteers("earthquake"));
  const [assignModal, setAssignModal] = useState<{ open: boolean; volunteerId: string | null }>({
    open: false,
    volunteerId: null,
  });
  const [resupplyModal, setResupplyModal] = useState<{ open: boolean; ref: string | null }>({
    open: false,
    ref: null,
  });

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setVolunteers(buildVolunteers(disasterType));
  }, [disasterType]);

  async function fetchPrediction() {
    try {
      setPredictLoading(true);
      setPredictError(null);
      setPrediction(null);

      const res = await fetch("/api/resource-predict", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ disasterType, resources: disaster.resources }),
      });
      const data: unknown = await res.json().catch(() => null);
      if (!res.ok) {
        const msg =
          data && typeof data === "object" && "error" in data && typeof (data as { error?: unknown }).error === "string"
            ? (data as { error: string }).error
            : `Request failed (${res.status})`;
        throw new Error(msg);
      }
      if (
        !data ||
        typeof data !== "object" ||
        !("predictions" in data) ||
        !("recommendation" in data)
      ) {
        throw new Error("Malformed response from /api/resource-predict");
      }
      setPrediction(data as ResourcePredictResponse);
    } catch (err) {
      setPredictError(err instanceof Error ? err.message : "Failed to fetch prediction");
    } finally {
      setPredictLoading(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchPrediction();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [disasterType]);

  const assignTarget = useMemo(
    () => volunteers.find((v) => v.id === assignModal.volunteerId) ?? null,
    [assignModal.volunteerId, volunteers]
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="flex flex-1 flex-col bg-black"
    >
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 py-8 space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">Resources</h1>
          <p className="mt-1 text-sm text-gray-400">
            Live inventory & staffing —{" "}
            <span className="text-gray-200 font-semibold">{disaster.name}</span>
          </p>
        </div>

        <section className="space-y-3">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-lg font-semibold text-white">Resource Levels</h2>
            <span className="text-xs text-gray-500">From current disaster config</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {disaster.resources.map((r, idx) => (
              <div
                key={`${r.name}-${idx}`}
                className="rounded-xl bg-gray-950/70 ring-1 ring-white/10 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-white font-semibold truncate">{r.name}</div>
                    <div className="mt-1 text-sm text-gray-400">
                      Units available: <span className="text-gray-200 font-semibold">{r.units}</span>
                    </div>
                  </div>
                  <span
                    className={[
                      "inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold ring-1 shrink-0",
                      statusBadgeClass(r.status),
                    ].join(" ")}
                  >
                    {r.status}
                  </span>
                </div>

                <div className="mt-4">
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>Stock</span>
                    <span className="text-gray-200 font-semibold">{r.percent}%</span>
                  </div>
                  <div className="mt-2 h-2 rounded-full bg-white/10 overflow-hidden ring-1 ring-white/10">
                    <motion.div
                      key={`${disasterType}-${r.name}`}
                      initial={{ width: 0 }}
                      animate={{ width: `${r.percent}%` }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                      className={["h-full", barColorClass(r.percent)].join(" ")}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-xl bg-gray-950/70 ring-1 ring-white/10 overflow-hidden">
          <div className="px-5 py-4 flex items-center justify-between gap-4 border-b border-white/10">
            <div className="min-w-0">
              <h2 className="text-lg font-semibold text-white">AI Prediction</h2>
              <p className="mt-1 text-xs text-gray-500">Shortage forecast powered by Grok</p>
            </div>
            <button
              type="button"
              onClick={fetchPrediction}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors ring-1 ring-white/10 px-4 py-2 text-sm font-semibold text-white"
            >
              <Send className="h-4 w-4" aria-hidden="true" />
              Refresh
            </button>
          </div>

          <div className="px-5 py-5">
            {predictLoading ? (
              <div className="space-y-3">
                <div className="h-4 w-40 bg-white/10 rounded" />
                <div className="h-3 w-full bg-white/10 rounded" />
                <div className="h-3 w-5/6 bg-white/10 rounded" />
                <div className="h-3 w-2/3 bg-white/10 rounded" />
              </div>
            ) : predictError ? (
              <div className="rounded-lg bg-red-500/10 ring-1 ring-red-500/30 px-4 py-3 text-sm text-red-200">
                {predictError}
              </div>
            ) : prediction ? (
              <div className="space-y-4">
                <div className="grid gap-2">
                  {prediction.predictions.map((p, idx) => (
                    <div
                      key={`${p.resource}-${idx}`}
                      className="flex items-start justify-between gap-3 rounded-lg bg-white/5 ring-1 ring-white/10 px-4 py-3"
                    >
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-white truncate">{p.resource}</div>
                        <div className="mt-1 text-xs text-gray-400 truncate">{p.urgency}</div>
                      </div>
                      <div className="shrink-0 text-sm text-gray-200 font-semibold">
                        {p.hoursRemaining}h
                      </div>
                    </div>
                  ))}
                </div>

                <div className="rounded-lg bg-white/5 ring-1 ring-white/10 px-4 py-3">
                  <div className="text-sm font-semibold text-white">Recommendation</div>
                  <p className="mt-2 text-sm text-gray-200 leading-6">{prediction.recommendation}</p>
                </div>
              </div>
            ) : (
              <div className="text-sm text-gray-400">
                Prediction will load automatically and refresh on disaster changes.
              </div>
            )}
          </div>
        </section>

        <section className="rounded-xl bg-gray-950/70 ring-1 ring-white/10 overflow-hidden">
          <div className="px-5 py-4 flex items-center justify-between gap-4 border-b border-white/10">
            <div className="min-w-0 flex items-center gap-2">
              <Users className="h-5 w-5 text-gray-300" aria-hidden="true" />
              <h2 className="text-lg font-semibold text-white">Volunteers</h2>
            </div>
            <button
              type="button"
              onClick={() => {
                const ref = `REQ-2024-${Math.floor(100000 + Math.random() * 900000)}`;
                setResupplyModal({ open: true, ref });
              }}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 hover:bg-red-500 transition-colors ring-1 ring-red-500/30 px-4 py-2 text-sm font-semibold text-white"
            >
              <PackagePlus className="h-4 w-4" aria-hidden="true" />
              Request Emergency Resupply
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="text-xs uppercase tracking-wide text-gray-500">
                <tr className="border-b border-white/10">
                  <th className="px-5 py-3 text-left font-semibold">Name</th>
                  <th className="px-5 py-3 text-left font-semibold">Skill</th>
                  <th className="px-5 py-3 text-left font-semibold">Current task</th>
                  <th className="px-5 py-3 text-left font-semibold">Location</th>
                  <th className="px-5 py-3 text-left font-semibold">Status</th>
                  <th className="px-5 py-3 text-right font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {volunteers.map((v) => (
                  <tr key={v.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-5 py-4 text-white font-semibold whitespace-nowrap">{v.name}</td>
                    <td className="px-5 py-4 text-gray-200 whitespace-nowrap">{v.skill}</td>
                    <td className="px-5 py-4 text-gray-300 min-w-[220px]">{v.task}</td>
                    <td className="px-5 py-4 text-gray-300 whitespace-nowrap">{v.location}</td>
                    <td className="px-5 py-4">
                      <span
                        className={[
                          "inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold ring-1",
                          volunteerStatusClass(v.status),
                        ].join(" ")}
                      >
                        {v.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <button
                        type="button"
                        onClick={() => setAssignModal({ open: true, volunteerId: v.id })}
                        className="inline-flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 transition-colors ring-1 ring-white/10 px-3 py-2 text-xs font-semibold text-white"
                      >
                        Assign Task
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {assignModal.open ? (
        <div className="fixed inset-0 z-[60]">
          <div
            className="absolute inset-0 bg-black/70"
            onClick={() => setAssignModal({ open: false, volunteerId: null })}
          />
          <div className="absolute inset-x-0 top-24 mx-auto w-[92%] max-w-md">
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="rounded-xl bg-gray-950 ring-1 ring-white/10 shadow-xl p-5"
            >
              <div className="text-lg font-bold text-white">Assign Task</div>
              <p className="mt-2 text-sm text-gray-300">
                {assignTarget ? (
                  <>
                    Task assigned to <span className="text-gray-100 font-semibold">{assignTarget.name}</span>.
                  </>
                ) : (
                  "Task assigned."
                )}
              </p>
              <div className="mt-4 rounded-lg bg-white/5 ring-1 ring-white/10 p-4">
                <div className="text-sm font-semibold text-white">Assigned task</div>
                <div className="mt-1 text-sm text-gray-200">
                  Proceed to nearest command post and coordinate with incident lead.
                </div>
              </div>
              <div className="mt-5 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setAssignModal({ open: false, volunteerId: null })}
                  className="rounded-lg bg-white/5 hover:bg-white/10 transition-colors ring-1 ring-white/10 px-4 py-2 text-sm font-semibold text-white"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (assignTarget) {
                      setVolunteers((prev) =>
                        prev.map((v) =>
                          v.id === assignTarget.id
                            ? { ...v, task: "Assigned: Command post coordination", status: "DEPLOYED" }
                            : v
                        )
                      );
                    }
                    setAssignModal({ open: false, volunteerId: null });
                  }}
                  className="rounded-lg bg-red-600 hover:bg-red-500 transition-colors ring-1 ring-red-500/30 px-4 py-2 text-sm font-semibold text-white"
                >
                  Confirm
                </button>
              </div>
            </motion.div>
          </div>
        </div>
      ) : null}

      {resupplyModal.open ? (
        <div className="fixed inset-0 z-[60]">
          <div
            className="absolute inset-0 bg-black/70"
            onClick={() => setResupplyModal({ open: false, ref: null })}
          />
          <div className="absolute inset-x-0 top-24 mx-auto w-[92%] max-w-md">
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="rounded-xl bg-gray-950 ring-1 ring-white/10 shadow-xl p-5"
            >
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-full bg-emerald-500/15 ring-1 ring-emerald-500/30 flex items-center justify-center">
                  <CheckCircle2 className="h-5 w-5 text-emerald-400" aria-hidden="true" />
                </div>
                <div className="min-w-0">
                  <div className="text-white font-semibold">Resupply request sent</div>
                  <div className="mt-1 text-sm text-gray-300">
                    Resupply request sent to Regional Emergency Authority. Reference:{" "}
                    <span className="font-mono text-gray-100">{resupplyModal.ref}</span>
                  </div>
                </div>
              </div>
              <div className="mt-5 flex justify-end">
                <button
                  type="button"
                  onClick={() => setResupplyModal({ open: false, ref: null })}
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

