"use client";

import { useLanguage } from "@/context/LanguageContext";

export default function DemoModeBadge() {
  const { t } = useLanguage();
  return (
    <div className="fixed bottom-4 right-4 z-[70] rounded-full bg-orange-500/15 text-orange-200 ring-1 ring-orange-500/30 px-4 py-2 text-sm font-semibold">
      {t("simulationActive")}
    </div>
  );
}

