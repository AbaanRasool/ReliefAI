"use client";

import React, { createContext, useContext, useMemo, useState } from "react";

import { disasterConfig, type DisasterType } from "@/data/disasters";

type Disaster = (typeof disasterConfig)[DisasterType];

type DisasterContextValue = {
  disasterType: DisasterType;
  setDisasterType: React.Dispatch<React.SetStateAction<DisasterType>>;
  disaster: Disaster;
  disasterConfig: typeof disasterConfig;
};

const DisasterContext = createContext<DisasterContextValue | null>(null);

export function DisasterProvider({ children }: { children: React.ReactNode }) {
  const [disasterType, setDisasterType] = useState<DisasterType>("earthquake");

  const value = useMemo<DisasterContextValue>(() => {
    return {
      disasterType,
      setDisasterType,
      disaster: disasterConfig[disasterType],
      disasterConfig,
    };
  }, [disasterType]);

  return <DisasterContext.Provider value={value}>{children}</DisasterContext.Provider>;
}

export function useDisaster() {
  const ctx = useContext(DisasterContext);
  if (!ctx) {
    throw new Error("useDisaster must be used within a DisasterProvider");
  }
  return ctx;
}
