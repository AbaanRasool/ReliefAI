"use client";

import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ExternalLink, Loader2, MapPin } from "lucide-react";

import { useDisaster } from "@/context/DisasterContext";
import { useLanguage } from "@/context/LanguageContext";

function statusBadgeClass(status: string) {
  switch (status) {
    case "AVAILABLE":
      return "bg-emerald-500/15 text-emerald-300 ring-emerald-500/30";
    case "OVERCROWDED":
      return "bg-red-500/15 text-red-300 ring-red-500/30";
    case "DAMAGED":
      return "bg-orange-500/15 text-orange-300 ring-orange-500/30";
    case "INACCESSIBLE":
    case "EVACUATING":
      return "bg-gray-500/15 text-gray-300 ring-gray-500/30";
    default:
      return "bg-white/10 text-gray-200 ring-white/15";
  }
}

function statusBadgeLabel(
  status: string,
  t: (k: import("@/context/LanguageContext").TranslationKey) => string
) {
  switch (status) {
    case "AVAILABLE":
      return t("available");
    case "OVERCROWDED":
      return t("overcrowded");
    case "DAMAGED":
      return t("damaged");
    case "INACCESSIBLE":
    case "EVACUATING":
      return t("warning");
    default:
      return status;
  }
}

function buildEmbedSrc(key: string, query: string) {
  const q = encodeURIComponent(query);
  return `https://www.google.com/maps/embed/v1/search?key=${encodeURIComponent(key)}&q=${q}`;
}

function pickRouteSuggestion(mapAlerts: readonly string[]) {
  const preferred = mapAlerts.find((a) => a.toLowerCase().includes("— clear")) ??
    mapAlerts.find((a) => a.toLowerCase().includes("evacuation route")) ??
    mapAlerts.find((a) => a.toLowerCase().includes("safe")) ??
    null;

  if (preferred) return preferred;
  return "Use major highways / inland routes and avoid the blocked segments listed above.";
}

export default function MapPage() {
  const { disaster } = useDisaster();
  const { t } = useLanguage();

  const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY ?? "";
  const defaultQuery = "hospitals near Srinagar Kashmir";

  const [iframeSrc, setIframeSrc] = useState<string>(() =>
    key ? buildEmbedSrc(key, defaultQuery) : ""
  );
  const [locating, setLocating] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);

  const routeSuggestion = useMemo(
    () => pickRouteSuggestion(disaster.mapAlerts as readonly string[]),
    [disaster.mapAlerts]
  );

  async function findHospitalsNearMe() {
    if (!key) {
      setGeoError("Missing NEXT_PUBLIC_GOOGLE_MAPS_KEY");
      return;
    }

    setLocating(true);
    setGeoError(null);

    if (!navigator.geolocation) {
      setGeoError("Geolocation is not supported in this browser.");
      setLocating(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setIframeSrc(buildEmbedSrc(key, `hospitals near ${lat},${lng}`));
        setLocating(false);
      },
      () => {
        setIframeSrc(buildEmbedSrc(key, defaultQuery));
        setGeoError("Could not get your location. Using Srinagar default.");
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="flex flex-1 flex-col bg-[#0f2027]"
    >
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 py-8 space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">{t("map")}</h1>
          <p className="mt-1 text-sm text-[#7aa8b8]">
            Hospital access and routing view —{" "}
            <span className="text-white font-semibold">{disaster.name}</span>
          </p>
        </div>

        <section className="rounded-xl bg-[#1a3a4a] ring-1 ring-white/10 overflow-hidden">
          <div className="px-5 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-white/10">
            <div className="min-w-0">
              <div className="text-sm font-semibold text-white">Nearby hospitals</div>
              <div className="text-xs text-[#4a7a8a] truncate">
                Embedded search via Google Maps (iframe)
              </div>
            </div>

            <button
              type="button"
              onClick={findHospitalsNearMe}
              disabled={locating}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors ring-1 ring-white/10 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {locating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  Locating…
                </>
              ) : (
                <>
                  <MapPin className="h-4 w-4" aria-hidden="true" />
                  {t("findHospitals")}
                </>
              )}
            </button>
          </div>

          <div className="px-5 py-4">
            {!key ? (
              <div className="rounded-lg bg-yellow-500/10 ring-1 ring-yellow-500/30 px-4 py-3 text-sm text-yellow-200">
                Missing <span className="font-mono">NEXT_PUBLIC_GOOGLE_MAPS_KEY</span>. Add it to
                your environment to enable the embedded map.
              </div>
            ) : null}

            {geoError ? (
              <div className="mt-3 rounded-lg bg-white/5 ring-1 ring-white/10 px-4 py-3 text-sm text-gray-200">
                {geoError}
              </div>
            ) : null}

            <div className="mt-4 rounded-xl overflow-hidden ring-1 ring-white/10 bg-[#162d3a]">
              {key ? (
                <iframe
                  src={iframeSrc}
                  width="100%"
                  height="400"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Hospital map"
                />
              ) : (
                <div className="h-[400px] flex items-center justify-center text-sm text-[#4a7a8a]">
                  Map disabled (missing key).
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="space-y-3">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-lg font-semibold text-white">{t("hospitals")}</h2>
            <span className="text-xs text-[#4a7a8a]">{t("fromConfig")}</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {disaster.hospitals.map((h, idx) => (
              <div
                key={`${h.name}-${idx}`}
                className="rounded-xl bg-[#1a3a4a] ring-1 ring-white/10 p-4 flex items-start justify-between gap-4"
              >
                <div className="min-w-0">
                  <div className="text-white font-semibold truncate">{h.name}</div>
                  <div className="mt-1 text-sm text-[#7aa8b8]">
                    {h.distance.replace(/\bkm\b/i, t("km"))} <span className="text-[#4a7a8a]">•</span>{" "}
                    {t("eta")} {h.eta}
                  </div>
                  <div className="mt-3">
                    <span
                      className={[
                        "inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold ring-1",
                        statusBadgeClass(h.status),
                      ].join(" ")}
                    >
                      {statusBadgeLabel(h.status, t)}
                    </span>
                  </div>
                </div>

                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(h.name)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="shrink-0 inline-flex items-center justify-center gap-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors ring-1 ring-white/10 px-3 py-2 text-sm font-semibold text-white"
                >
                  <ExternalLink className="h-4 w-4" aria-hidden="true" />
                  {t("getDirections")}
                </a>
              </div>
            ))}
          </div>
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 rounded-xl bg-[#1a3a4a] ring-1 ring-white/10 p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <h2 className="text-lg font-semibold text-white">{t("smartRouting")}</h2>
                <p className="mt-1 text-sm text-[#7aa8b8]">
                  AI has rerouted ambulances avoiding:{" "}
                  <span className="text-gray-200 font-semibold">
                    {(disaster.blockedRoutes as readonly string[]).join(", ")}
                  </span>
                </p>
              </div>
            </div>

            <div className="mt-4 rounded-lg bg-white/5 ring-1 ring-white/10 p-4">
              <div className="text-sm font-semibold text-white">Clear route suggestion</div>
              <p className="mt-2 text-sm text-gray-200">{routeSuggestion}</p>
              <div className="mt-3 text-xs text-[#4a7a8a]">
                Signals from map alerts: {(disaster.mapAlerts as readonly string[]).join(" • ")}
              </div>
            </div>
          </div>

          <div className="rounded-xl bg-[#1a3a4a] ring-1 ring-white/10 p-5">
            <h2 className="text-lg font-semibold text-white">Map Legend</h2>
            <div className="mt-4 space-y-3 text-sm">
              <div className="flex items-center gap-3 text-gray-200">
                <span className="h-3 w-3 rounded-full bg-red-500" />
                <span>Red pin = Collapse/emergency site</span>
              </div>
              <div className="flex items-center gap-3 text-gray-200">
                <span className="h-3 w-3 rounded-full bg-sky-400" />
                <span>Blue pin = Hospital</span>
              </div>
              <div className="flex items-center gap-3 text-gray-200">
                <span className="h-3 w-3 rounded-full bg-emerald-500" />
                <span>Green pin = Volunteer team</span>
              </div>
              <div className="flex items-center gap-3 text-gray-200">
                <span className="h-3 w-3 rounded-full bg-orange-500" />
                <span>Orange pin = SOS location</span>
              </div>
            </div>
          </div>
        </section>
      </div>
    </motion.div>
  );
}

