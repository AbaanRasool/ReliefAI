"use client";

import Link from "next/link";
import React, { useEffect, useMemo, useState } from "react";
import { animate, motion, useMotionValue } from "framer-motion";
import { RefreshCcw } from "lucide-react";

import { useDisaster } from "@/context/DisasterContext";
import { useLanguage } from "@/context/LanguageContext";
import type { DisasterType } from "@/data/disasters";

type UserSosAlert = {
  msg: string;
  priority: string;
  time: string;
  isNew?: boolean;
};

const SOS_FEED_KEY = "sos_reports";
const SOS_FEED_UPDATED_EVENT = "sos_reports_updated";

function safeReadSosFeed(): UserSosAlert[] {
  try {
    if (typeof window === "undefined") return [];
    const raw = window.localStorage.getItem(SOS_FEED_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((x): x is UserSosAlert => {
      if (!x || typeof x !== "object") return false;
      const a = x as Partial<UserSosAlert>;
      return typeof a.msg === "string" && typeof a.priority === "string" && typeof a.time === "string";
    });
  } catch {
    return [];
  }
}

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

function hospitalStatusLabel(status: string, t: (k: import("@/context/LanguageContext").TranslationKey) => string) {
  switch (status) {
    case "AVAILABLE":
      return t("available");
    case "OVERCROWDED":
      return t("overcrowded");
    case "DAMAGED":
      return t("damaged");
    case "INACCESSIBLE":
      return t("warning");
    default:
      return status;
  }
}

export default function DashboardPage() {
  const { disaster, disasterType } = useDisaster();
  const { t } = useLanguage();

  const [userSosAlerts, setUserSosAlerts] = useState<UserSosAlert[]>(() => safeReadSosFeed());

  const [aiSummaryByType, setAiSummaryByType] = useState<
    Partial<Record<DisasterType, string>>
  >({});
  const [refreshing, setRefreshing] = useState(false);
  const [refreshErrorByType, setRefreshErrorByType] = useState<
    Partial<Record<DisasterType, string>>
  >({});

  const aiSummary = aiSummaryByType[disasterType] ?? disaster.aiSummary;
  const refreshError = refreshErrorByType[disasterType] ?? null;

  const mergedSosAlerts = useMemo(
    () => [...userSosAlerts, ...disaster.sosAlerts],
    [userSosAlerts, disaster.sosAlerts]
  );

  const statCards = useMemo(
    () =>
      [
        {
          label: t("activeSOS"),
          value: <CountUp value={disaster.stats.sos} />,
          border: "border-[#0d9488]/60",
          sub: "Open incident requests",
        },
        {
          label: t("criticalCases"),
          value: <CountUp value={disaster.stats.critical} />,
          border: "border-orange-500/60",
          sub: "Immediate attention needed",
        },
        {
          label: t("hospitalsOnline"),
          value: <span>{disaster.stats.hospitals}</span>,
          border: "border-sky-500/60",
          sub: "Operational & reachable",
        },
        {
          label: t("volunteersActive"),
          value: <CountUp value={disaster.stats.volunteers} />,
          border: "border-emerald-500/60",
          sub: "Responders on ground",
        },
      ] as const,
    [disaster.stats, t]
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

  useEffect(() => {
    function refreshFromStorage() {
      setUserSosAlerts(safeReadSosFeed());
    }

    function onStorage(e: StorageEvent) {
      if (e.key === SOS_FEED_KEY) refreshFromStorage();
    }

    function onCustomUpdate() {
      refreshFromStorage();
    }

    window.addEventListener("storage", onStorage);
    window.addEventListener(SOS_FEED_UPDATED_EVENT, onCustomUpdate);
    refreshFromStorage();
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener(SOS_FEED_UPDATED_EVENT, onCustomUpdate);
    };
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="flex flex-1 flex-col bg-[#0f2027]"
    >
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 py-8 space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white truncate">
              {t("dashboard")}
            </h1>
            <p className="text-sm text-[#7aa8b8] mt-1 truncate">
              Live operational view — {disaster.name}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {statCards.map((c) => (
            <div
              key={c.label}
              className={[
                "rounded-xl border bg-[#1a3a4a] ring-1 ring-white/10 p-4",
                c.border,
              ].join(" ")}
            >
              <div className="text-sm text-[#7aa8b8]">{c.label}</div>
              <div className="mt-2 text-3xl font-bold text-white tabular-nums">{c.value}</div>
              <div className="mt-2 text-xs text-[#4a7a8a]">{c.sub}</div>
            </div>
          ))}
        </div>

        <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 rounded-xl bg-[#1a3a4a] ring-1 ring-white/10 overflow-hidden">
            <div className="border-t-4 border-[#0d9488] px-5 py-4 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-2 rounded-full bg-[#0d9488]/15 px-3 py-1 text-xs font-semibold text-[#2dd4bf] ring-1 ring-[#0d9488]/25">
                    <span className="relative flex h-2 w-2">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#2dd4bf] opacity-60" />
                      <span className="relative inline-flex h-2 w-2 rounded-full bg-[#2dd4bf]" />
                    </span>
                    {t("liveAI")}
                  </span>
                </div>
                <h2 className="mt-3 text-lg font-semibold text-white">{t("aiSituation")}</h2>
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
                {t("refresh")}
              </button>
            </div>
            <div className="px-5 pb-5">
              <p className="text-sm leading-6 text-white whitespace-pre-line">{aiSummary}</p>
              {refreshError ? (
                <p className="mt-3 text-sm text-red-300">{refreshError}</p>
              ) : null}
            </div>
          </div>

          <div className="rounded-xl bg-[#1a3a4a] ring-1 ring-white/10 p-5">
            <h2 className="text-lg font-semibold text-white">{t("quickActions")}</h2>
            <div className="mt-4 grid grid-cols-1 gap-2">
              <Link
                href="/sos"
                className="rounded-lg bg-white/5 hover:bg-white/10 transition-colors ring-1 ring-white/10 px-4 py-3 text-sm font-semibold text-white"
              >
                {t("sendSOS")}
              </Link>
              <Link
                href="/triage"
                className="rounded-lg bg-white/5 hover:bg-white/10 transition-colors ring-1 ring-white/10 px-4 py-3 text-sm font-semibold text-white"
              >
                {t("runTriage")}
              </Link>
              <Link
                href="/map"
                className="rounded-lg bg-white/5 hover:bg-white/10 transition-colors ring-1 ring-white/10 px-4 py-3 text-sm font-semibold text-white"
              >
                {t("viewMap")}
              </Link>
              <Link
                href="/resources"
                className="rounded-lg bg-white/5 hover:bg-white/10 transition-colors ring-1 ring-white/10 px-4 py-3 text-sm font-semibold text-white"
              >
                {t("checkResources")}
              </Link>
            </div>
          </div>
        </section>

        <section className="rounded-xl bg-[#1a3a4a] ring-1 ring-white/10 overflow-hidden">
          <div className="px-5 py-4 border-b border-white/10">
            <h2 className="text-lg font-semibold text-white">{t("recentAlerts")}</h2>
          </div>
          <div className="divide-y divide-white/10">
            {mergedSosAlerts.map((a, idx) => (
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
                    {"isNew" in a && (a as { isNew?: unknown }).isNew ? (
                      <span className="inline-flex items-center rounded-full px-2 py-1 text-xs font-extrabold tracking-wide bg-red-600/20 text-red-200 ring-1 ring-red-500/30 animate-pulse">
                        NEW
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-2 text-sm text-white">{a.msg}</p>
                </div>
                <div className="shrink-0 text-xs text-[#7aa8b8] pt-1">{a.time}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-xl bg-[#1a3a4a] ring-1 ring-white/10 p-5">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-lg font-semibold text-white">{t("hospitals")}</h2>
            <span className="text-xs text-[#7aa8b8]">{t("statusStrip")}</span>
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
                  {hospitalStatusLabel(h.status, t)}
                </span>
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-white truncate">{h.name}</div>
                  <div className="text-xs text-[#7aa8b8] truncate">
                    {h.distance.replace(/\bkm\b/i, t("km"))} • {t("eta")} {h.eta}
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
