"use client";

import Link from "next/link";
import React, { useEffect, useMemo, useState } from "react";
import { animate, motion, useMotionValue } from "framer-motion";
import { RefreshCcw } from "lucide-react";

import { useDisaster } from "@/context/DisasterContext";
import type { DisasterType } from "@/data/disasters";

function CountUp({ value }: { value: number }) {
  const mv = useMotionValue(0);
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const controls = animate(mv, value, { duration: 1.2, ease: "easeOut" });
    const unsub = mv.on("change", (latest) => setDisplay(Math.round(latest)));
    return () => {
      controls.stop();
      unsub();
    };
  }, [mv, value]);

  return <span>{display.toLocaleString()}</span>;
}

function priorityClass(priority: string) {
  switch (priority) {
    case "CRITICAL":
      return "bg-red-500/15 text-red-300 ring-red-500/30";
    case "HIGH":
      return "bg-orange-500/15 text-orange-300 ring-orange-500/30";
    case "MEDIUM":
      return "bg-yellow-500/15 text-yellow-200 ring-yellow-500/30";
    case "STABLE":
      return "bg-emerald-500/15 text-emerald-300 ring-emerald-500/30";
    default:
      return "bg-white/10 text-gray-200 ring-white/15";
  }
}

function hospitalStatusClass(status: string) {
  switch (status) {
    case "AVAILABLE":
      return "bg-emerald-500/15 text-emerald-300 ring-emerald-500/30";
    case "OVERCROWDED":
      return "bg-red-500/15 text-red-300 ring-red-500/30";
    case "DAMAGED":
      return "bg-orange-500/15 text-orange-300 ring-orange-500/30";
    case "INACCESSIBLE":
      return "bg-gray-500/15 text-gray-300 ring-gray-500/30";
    default:
      return "bg-white/10 text-gray-200 ring-white/15";
  }
}

export default function DashboardPage() {
  const { disaster, disasterType } = useDisaster();

  const [aiSummaryByType, setAiSummaryByType] = useState<
    Partial<Record<DisasterType, string>>
  >({});
  const [refreshing, setRefreshing] = useState(false);
  const [refreshErrorByType, setRefreshErrorByType] = useState<
    Partial<Record<DisasterType, string>>
  >({});

  const aiSummary = aiSummaryByType[disasterType] ?? disaster.aiSummary;
  const refreshError = refreshErrorByType[disasterType] ?? null;

  const statCards = useMemo(
    () =>
      [
        {
          label: "Active SOS",
          value: <CountUp value={disaster.stats.sos} />,
          border: "border-red-600/60",
          sub: "Open incident requests",
        },
        {
          label: "Critical Cases",
          value: <CountUp value={disaster.stats.critical} />,
          border: "border-orange-500/60",
          sub: "Immediate attention needed",
        },
        {
          label: "Hospitals Online",
          value: <span>{disaster.stats.hospitals}</span>,
          border: "border-sky-500/60",
          sub: "Operational & reachable",
        },
        {
          label: "Volunteers Active",
          value: <CountUp value={disaster.stats.volunteers} />,
          border: "border-emerald-500/60",
          sub: "Responders on ground",
        },
      ] as const,
    [disaster.stats]
  );

  async function refreshSituation() {
    try {
      setRefreshing(true);
      setRefreshErrorByType((prev) => ({ ...prev, [disasterType]: undefined }));
      const res = await fetch("/api/situation", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ disasterType } satisfies { disasterType: DisasterType }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Request failed (${res.status})`);
      }

      const data: unknown = await res.json();
      if (
        !data ||
        typeof data !== "object" ||
        !("summary" in data) ||
        typeof (data as { summary?: unknown }).summary !== "string"
      ) {
        throw new Error("Malformed response from /api/situation");
      }

      setAiSummaryByType((prev) => ({ ...prev, [disasterType]: (data as { summary: string }).summary }));
    } catch (err) {
      setRefreshErrorByType((prev) => ({
        ...prev,
        [disasterType]: err instanceof Error ? err.message : "Failed to refresh AI analysis",
      }));
    } finally {
      setRefreshing(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="flex flex-1 flex-col bg-black"
    >
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 py-8 space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white truncate">
              Dashboard
            </h1>
            <p className="text-sm text-gray-400 mt-1 truncate">
              Live operational view — {disaster.name}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {statCards.map((c) => (
            <div
              key={c.label}
              className={[
                "rounded-xl border bg-gray-950/60 ring-1 ring-white/10 p-4",
                c.border,
              ].join(" ")}
            >
              <div className="text-sm text-gray-300">{c.label}</div>
              <div className="mt-2 text-3xl font-bold text-white tabular-nums">{c.value}</div>
              <div className="mt-2 text-xs text-gray-500">{c.sub}</div>
            </div>
          ))}
        </div>

        <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 rounded-xl bg-gray-950/70 ring-1 ring-white/10 overflow-hidden">
            <div className="border-t-4 border-red-600 px-5 py-4 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-2 rounded-full bg-red-500/15 px-3 py-1 text-xs font-semibold text-red-200 ring-1 ring-red-500/25">
                    <span className="relative flex h-2 w-2">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-60" />
                      <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
                    </span>
                    LIVE AI ANALYSIS
                  </span>
                </div>
                <h2 className="mt-3 text-lg font-semibold text-white">AI Situation Awareness</h2>
              </div>

              <button
                type="button"
                onClick={refreshSituation}
                disabled={refreshing}
                className="shrink-0 inline-flex items-center gap-2 rounded-md bg-white/5 px-3 py-2 text-sm text-gray-200 hover:bg-white/10 transition-colors ring-1 ring-white/10 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <RefreshCcw
                  className={["h-4 w-4", refreshing ? "animate-spin" : ""].join(" ")}
                  aria-hidden="true"
                />
                Refresh
              </button>
            </div>
            <div className="px-5 pb-5">
              <p className="text-sm leading-6 text-gray-200 whitespace-pre-line">{aiSummary}</p>
              {refreshError ? (
                <p className="mt-3 text-sm text-red-300">{refreshError}</p>
              ) : null}
            </div>
          </div>

          <div className="rounded-xl bg-gray-950/70 ring-1 ring-white/10 p-5">
            <h2 className="text-lg font-semibold text-white">Quick Actions</h2>
            <div className="mt-4 grid grid-cols-1 gap-2">
              <Link
                href="/sos"
                className="rounded-lg bg-white/5 hover:bg-white/10 transition-colors ring-1 ring-white/10 px-4 py-3 text-sm font-semibold text-white"
              >
                Send SOS
              </Link>
              <Link
                href="/triage"
                className="rounded-lg bg-white/5 hover:bg-white/10 transition-colors ring-1 ring-white/10 px-4 py-3 text-sm font-semibold text-white"
              >
                Run AI Triage
              </Link>
              <Link
                href="/map"
                className="rounded-lg bg-white/5 hover:bg-white/10 transition-colors ring-1 ring-white/10 px-4 py-3 text-sm font-semibold text-white"
              >
                View Map
              </Link>
              <Link
                href="/resources"
                className="rounded-lg bg-white/5 hover:bg-white/10 transition-colors ring-1 ring-white/10 px-4 py-3 text-sm font-semibold text-white"
              >
                Check Resources
              </Link>
            </div>
          </div>
        </section>

        <section className="rounded-xl bg-gray-950/70 ring-1 ring-white/10 overflow-hidden">
          <div className="px-5 py-4 border-b border-white/10">
            <h2 className="text-lg font-semibold text-white">Recent SOS Alerts</h2>
          </div>
          <div className="divide-y divide-white/10">
            {disaster.sosAlerts.map((a, idx) => (
              <div
                key={`${a.msg}-${idx}`}
                className="px-5 py-4 flex items-start justify-between gap-3 hover:bg-white/5 transition-colors"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      className={[
                        "inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold ring-1",
                        priorityClass(a.priority),
                      ].join(" ")}
                    >
                      {a.priority}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-gray-200">{a.msg}</p>
                </div>
                <div className="shrink-0 text-xs text-gray-400 pt-1">{a.time}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-xl bg-gray-950/70 ring-1 ring-white/10 p-5">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-lg font-semibold text-white">Hospitals</h2>
            <span className="text-xs text-gray-400">Status strip</span>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {disaster.hospitals.map((h, idx) => (
              <div
                key={`${h.name}-${idx}`}
                className="flex items-center gap-2 rounded-lg bg-white/5 ring-1 ring-white/10 px-3 py-2"
              >
                <span
                  className={[
                    "inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold ring-1",
                    hospitalStatusClass(h.status),
                  ].join(" ")}
                >
                  {h.status}
                </span>
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-white truncate">{h.name}</div>
                  <div className="text-xs text-gray-400 truncate">
                    {h.distance} • ETA {h.eta}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </motion.div>
  );
}
