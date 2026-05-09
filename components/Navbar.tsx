"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, Circle, Globe, Menu, X } from "lucide-react";
import React, { useMemo, useState } from "react";

import { useDisaster } from "@/context/DisasterContext";
import { useLanguage, type Language } from "@/context/LanguageContext";
import { type DisasterType } from "@/data/disasters";

const LANGUAGE_OPTIONS: ReadonlyArray<{ lang: Language; label: string }> = [
  { lang: "en", label: "English" },
  { lang: "hi", label: "हिंदी" },
  { lang: "ur", label: "اردو" },
];

const DISASTER_DOT_CLASS: Record<DisasterType, string> = {
  earthquake: "bg-amber-400",
  flood: "bg-sky-400",
  fire: "bg-orange-500",
  cyclone: "bg-purple-400",
  tsunami: "bg-cyan-400",
  drought: "bg-yellow-300",
};

function isActiveRoute(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function Navbar() {
  const pathname = usePathname() ?? "/";
  const [mobileOpen, setMobileOpen] = useState(false);
  const [selectorOpen, setSelectorOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);

  const { disasterType, setDisasterType, disaster, disasterConfig } = useDisaster();
  const { t, language, setLanguage } = useLanguage();

  const navLinks = useMemo(
    () =>
      [
        { href: "/", label: t("dashboard") },
        { href: "/sos", label: t("sosReport") },
        { href: "/triage", label: t("aiTriage") },
        { href: "/map", label: t("map") },
        { href: "/resources", label: t("resources") },
      ] as const,
    [t]
  );

  const disasters = useMemo(() => Object.keys(disasterConfig) as DisasterType[], [disasterConfig]);

  return (
    <header className="fixed top-0 inset-x-0 z-50">
      <div className="bg-[#0a1a24] border-l-4 border-[#0d9488]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="h-16 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="h-9 w-9 rounded-full bg-[#0d9488]/15 ring-1 ring-[#0d9488]/40 flex items-center justify-center shrink-0">
                <Circle className="h-4 w-4 text-[#2dd4bf] fill-[#2dd4bf]" aria-hidden="true" />
              </div>
              <div className="flex flex-col leading-tight min-w-0">
                <span className="text-white font-bold tracking-tight truncate">ReliefAI</span>
                <span className="text-xs text-[#7aa8b8] truncate">Disaster Response</span>
              </div>
            </div>

            <nav className="hidden md:flex items-center gap-1">
              {navLinks.map((l) => {
                const active = isActiveRoute(pathname, l.href);
                return (
                  <Link
                    key={l.href}
                    href={l.href}
                    className={[
                      "px-3 py-2 rounded-md text-sm font-medium transition-colors",
                      active ? "text-white bg-white/10" : "text-[#7aa8b8] hover:text-white hover:bg-white/5",
                    ].join(" ")}
                    aria-current={active ? "page" : undefined}
                  >
                    {l.label}
                  </Link>
                );
              })}

              <div className="relative ml-1">
                <button
                  type="button"
                  onClick={() => setLangOpen((v) => !v)}
                  className="inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm text-[#7aa8b8] hover:bg-white/10 transition-colors ring-1 ring-white/10 bg-white/5"
                  aria-haspopup="listbox"
                  aria-expanded={langOpen}
                  title="Language"
                >
                  <Globe className="h-4 w-4 text-[#7aa8b8]" aria-hidden="true" />
                  <ChevronDown className="h-4 w-4 text-[#7aa8b8]" aria-hidden="true" />
                </button>

                {langOpen ? (
                  <div
                    className="absolute right-0 mt-2 w-40 rounded-lg bg-[#0a1a24] ring-1 ring-white/10 shadow-lg overflow-hidden"
                    role="listbox"
                  >
                    <ul className="py-1">
                      {LANGUAGE_OPTIONS.map((opt) => {
                        const active = opt.lang === language;
                        return (
                          <li key={opt.lang}>
                            <button
                              type="button"
                              onClick={() => {
                                setLanguage(opt.lang);
                                setLangOpen(false);
                              }}
                              className={[
                                "w-full px-3 py-2 text-left text-sm transition-colors",
                                active ? "bg-white/10 text-white" : "text-[#7aa8b8] hover:bg-white/5",
                              ].join(" ")}
                            >
                              {opt.label}
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ) : null}
              </div>
            </nav>

            <div className="flex items-center gap-2">
              <div className="relative hidden sm:block">
                <button
                  type="button"
                  onClick={() => setSelectorOpen((v) => !v)}
                  className="inline-flex items-center gap-2 rounded-md bg-white/5 px-3 py-2 text-sm text-[#7aa8b8] hover:bg-white/10 transition-colors ring-1 ring-white/10"
                  aria-haspopup="listbox"
                  aria-expanded={selectorOpen}
                >
                  <span className={`h-2.5 w-2.5 rounded-full ${DISASTER_DOT_CLASS[disasterType]}`} />
                  <span className="max-w-40 truncate">{disaster.name}</span>
                  <ChevronDown className="h-4 w-4 text-[#7aa8b8]" aria-hidden="true" />
                </button>

                {selectorOpen ? (
                  <div
                    className="absolute right-0 mt-2 w-64 rounded-lg bg-[#0a1a24] ring-1 ring-white/10 shadow-lg overflow-hidden"
                    role="listbox"
                  >
                    <div className="px-3 py-2 text-xs uppercase tracking-wide text-[#4a7a8a] border-b border-white/10">
                      Select disaster
                    </div>
                    <ul className="py-1">
                      {disasters.map((d) => {
                        const active = d === disasterType;
                        return (
                          <li key={d}>
                            <button
                              type="button"
                              onClick={() => {
                                setDisasterType(d);
                                setSelectorOpen(false);
                              }}
                              className={[
                                "w-full flex items-center gap-2 px-3 py-2 text-left text-sm transition-colors",
                                active ? "bg-white/10 text-white" : "text-[#7aa8b8] hover:bg-white/5",
                              ].join(" ")}
                            >
                              <span className={`h-2.5 w-2.5 rounded-full ${DISASTER_DOT_CLASS[d]}`} />
                              <span className="truncate">{disasterConfig[d].name}</span>
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ) : null}
              </div>

              <button
                type="button"
                className="md:hidden inline-flex items-center justify-center h-10 w-10 rounded-md bg-white/5 hover:bg-white/10 transition-colors ring-1 ring-white/10"
                onClick={() => setMobileOpen((v) => !v)}
                aria-label={mobileOpen ? "Close menu" : "Open menu"}
              >
                {mobileOpen ? (
                  <X className="h-5 w-5 text-[#7aa8b8]" aria-hidden="true" />
                ) : (
                  <Menu className="h-5 w-5 text-[#7aa8b8]" aria-hidden="true" />
                )}
              </button>
            </div>
          </div>
        </div>

        {mobileOpen ? (
          <div className="md:hidden border-t border-white/10">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 py-3 flex flex-col gap-2">
              <div className="grid gap-1">
                {navLinks.map((l) => {
                  const active = isActiveRoute(pathname, l.href);
                  return (
                    <Link
                      key={l.href}
                      href={l.href}
                      onClick={() => setMobileOpen(false)}
                      className={[
                        "px-3 py-2 rounded-md text-sm font-medium transition-colors",
                        active ? "text-white bg-white/10" : "text-[#7aa8b8] hover:bg-white/5",
                      ].join(" ")}
                      aria-current={active ? "page" : undefined}
                    >
                      {l.label}
                    </Link>
                  );
                })}
              </div>

              <div className="pt-2 border-t border-white/10">
                <div className="text-xs uppercase tracking-wide text-[#4a7a8a] mb-2">Disaster</div>
                <div className="grid gap-1">
                  {disasters.map((d) => {
                    const active = d === disasterType;
                    return (
                      <button
                        key={d}
                        type="button"
                        onClick={() => {
                          setDisasterType(d);
                          setMobileOpen(false);
                        }}
                        className={[
                          "w-full flex items-center gap-2 px-3 py-2 rounded-md text-left text-sm transition-colors",
                          active ? "bg-white/10 text-white" : "text-[#7aa8b8] hover:bg-white/5",
                        ].join(" ")}
                      >
                        <span className={`h-2.5 w-2.5 rounded-full ${DISASTER_DOT_CLASS[d]}`} />
                        <span className="truncate">{disasterConfig[d].name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="pt-2 border-t border-white/10">
                <div className="text-xs uppercase tracking-wide text-[#4a7a8a] mb-2">Language</div>
                <div className="grid gap-1">
                  {LANGUAGE_OPTIONS.map((opt) => {
                    const active = opt.lang === language;
                    return (
                      <button
                        key={opt.lang}
                        type="button"
                        onClick={() => {
                          setLanguage(opt.lang);
                          setMobileOpen(false);
                        }}
                        className={[
                          "w-full px-3 py-2 rounded-md text-left text-sm transition-colors",
                          active ? "bg-white/10 text-white" : "text-[#7aa8b8] hover:bg-white/5",
                        ].join(" ")}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      <div className="w-full bg-red-600 text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="h-10 flex items-center justify-center text-center text-sm font-semibold tracking-tight">
            <span className="truncate">{disaster.alertText}</span>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Navbar;
