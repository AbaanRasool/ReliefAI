"use client";

import { useEffect } from "react";
import { useLanguage } from "@/context/LanguageContext";

export default function BodyDir() {
  const { dir } = useLanguage();

  useEffect(() => {
    document.body.dir = dir;
  }, [dir]);

  return null;
}

