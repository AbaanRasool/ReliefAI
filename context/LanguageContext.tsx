"use client";

import React, { createContext, useCallback, useContext, useMemo, useState } from "react";

export type Language = "en" | "hi" | "ur";

const STORAGE_KEY = "reliefai:language";

const translations = {
  en: {
    dashboard: "Dashboard",
    sosReport: "SOS Report",
    aiTriage: "AI Triage",
    map: "Map",
    resources: "Resources",
    activeSOS: "Active SOS",
    criticalCases: "Critical Cases",
    hospitalsOnline: "Hospitals Online",
    volunteersActive: "Volunteers Active",
    quickActions: "Quick Actions",
    sendSOS: "Send SOS",
    runTriage: "Run AI Triage",
    viewMap: "View Map",
    checkResources: "Check Resources",
    recentAlerts: "Recent SOS Alerts",
    aiSituation: "AI Situation Awareness",
    hospitals: "Hospitals",
    liveAI: "LIVE AI ANALYSIS",
    refresh: "Refresh",
    name: "Name",
    location: "Location",
    emergencyType: "Emergency type",
    peopleAffected: "Number of people affected",
    trapped: "Are you trapped?",
    description: "Description",
    photoUpload: "Photo upload",
    sendSOSBtn: "SEND SOS",
    patientName: "Patient name",
    age: "Age",
    injuryType: "Injury type",
    symptoms: "Symptoms",
    trappedDebris: "Trapped under debris",
    unstableStructure: "Unstable structure nearby",
    runTiageBtn: "Run Triage",
    findHospitals: "Find Hospitals Near Me",
    getDirections: "Get Directions",
    smartRouting: "Smart Routing",
    resourceLevels: "Resource Levels",
    aiPrediction: "AI Prediction",
    volunteers: "Volunteers",
    requestResupply: "Request Emergency Resupply",
    available: "AVAILABLE",
    overcrowded: "OVERCROWDED",
    damaged: "DAMAGED",
    critical: "CRITICAL",
    high: "HIGH",
    medium: "MEDIUM",
    stable: "STABLE",
    warning: "WARNING",
    simulationActive: "Simulation Active",
    yes: "Yes",
    no: "No",
    bloodPressure: "Blood Pressure",
    pulse: "Pulse",
    skill: "Skill",
    currentTask: "Current task",
    status: "Status",
    action: "Action",
    fromConfig: "From current disaster config",
    statusStrip: "Status strip",
    eta: "ETA",
    km: "km",
    deployed: "DEPLOYED",
    offline: "OFFLINE",
    locating: "Locating…",
    assignTask: "Assign Task",
  },
  hi: {
    dashboard: "डैशबोर्ड",
    sosReport: "SOS रिपोर्ट",
    aiTriage: "AI ट्राइएज",
    map: "नक्शा",
    resources: "संसाधन",
    activeSOS: "सक्रिय SOS",
    criticalCases: "गंभीर मामले",
    hospitalsOnline: "अस्पताल उपलब्ध",
    volunteersActive: "स्वयंसेवक सक्रिय",
    quickActions: "त्वरित कार्रवाई",
    sendSOS: "SOS भेजें",
    runTriage: "AI ट्राइएज चलाएं",
    viewMap: "नक्शा देखें",
    checkResources: "संसाधन जांचें",
    recentAlerts: "हालिया SOS अलर्ट",
    aiSituation: "AI स्थिति जागरूकता",
    hospitals: "अस्पताल",
    liveAI: "लाइव AI विश्लेषण",
    refresh: "रिफ्रेश",
    name: "नाम",
    location: "स्थान",
    emergencyType: "आपातकाल का प्रकार",
    peopleAffected: "प्रभावित लोगों की संख्या",
    trapped: "क्या आप फंसे हैं?",
    description: "विवरण",
    photoUpload: "फोटो अपलोड",
    sendSOSBtn: "SOS भेजें",
    patientName: "मरीज का नाम",
    age: "आयु",
    injuryType: "चोट का प्रकार",
    symptoms: "लक्षण",
    trappedDebris: "मलबे के नीचे फंसे",
    unstableStructure: "अस्थिर संरचना पास में",
    runTiageBtn: "ट्राइएज चलाएं",
    findHospitals: "पास के अस्पताल खोजें",
    getDirections: "दिशा निर्देश",
    smartRouting: "स्मार्ट रूटिंग",
    resourceLevels: "संसाधन स्तर",
    aiPrediction: "AI पूर्वानुमान",
    volunteers: "स्वयंसेवक",
    requestResupply: "आपातकालीन आपूर्ति अनुरोध",
    available: "उपलब्ध",
    overcrowded: "अत्यधिक भीड़",
    damaged: "क्षतिग्रस्त",
    critical: "गंभीर",
    high: "उच्च",
    medium: "मध्यम",
    stable: "स्थिर",
    warning: "चेतावनी",
    simulationActive: "सिमुलेशन सक्रिय",
    yes: "हाँ",
    no: "नहीं",
    bloodPressure: "ब्लड प्रेशर",
    pulse: "नाड़ी",
    skill: "कौशल",
    currentTask: "वर्तमान कार्य",
    status: "स्थिति",
    action: "कार्रवाई",
    fromConfig: "वर्तमान आपदा कॉन्फ़िग से",
    statusStrip: "स्थिति पट्टी",
    eta: "अनुमानित समय",
    km: "किमी",
    deployed: "तैनात",
    offline: "ऑफ़लाइन",
    locating: "स्थान खोज रहे…",
    assignTask: "कार्य सौंपें",
  },
  ur: {
    dashboard: "ڈیش بورڈ",
    sosReport: "SOS رپورٹ",
    aiTriage: "AI ٹرائیج",
    map: "نقشہ",
    resources: "وسائل",
    activeSOS: "فعال SOS",
    criticalCases: "نازک کیسز",
    hospitalsOnline: "ہسپتال دستیاب",
    volunteersActive: "رضاکار فعال",
    quickActions: "فوری اقدامات",
    sendSOS: "SOS بھیجیں",
    runTriage: "AI ٹرائیج چلائیں",
    viewMap: "نقشہ دیکھیں",
    checkResources: "وسائل چیک کریں",
    recentAlerts: "حالیہ SOS الرٹس",
    aiSituation: "AI صورتحال آگاہی",
    hospitals: "ہسپتال",
    liveAI: "لائیو AI تجزیہ",
    refresh: "تازہ کریں",
    name: "نام",
    location: "مقام",
    emergencyType: "ہنگامی قسم",
    peopleAffected: "متاثرہ افراد کی تعداد",
    trapped: "کیا آپ پھنسے ہوئے ہیں؟",
    description: "تفصیل",
    photoUpload: "تصویر اپلوڈ",
    sendSOSBtn: "SOS بھیجیں",
    patientName: "مریض کا نام",
    age: "عمر",
    injuryType: "چوٹ کی قسم",
    symptoms: "علامات",
    trappedDebris: "ملبے کے نیچے پھنسے",
    unstableStructure: "غیر مستحکم ڈھانچہ قریب",
    runTiageBtn: "ٹرائیج چلائیں",
    findHospitals: "قریبی ہسپتال تلاش کریں",
    getDirections: "راستہ دیکھیں",
    smartRouting: "سمارٹ روٹنگ",
    resourceLevels: "وسائل کی سطح",
    aiPrediction: "AI پیشگوئی",
    volunteers: "رضاکار",
    requestResupply: "ہنگامی سامان کی درخواست",
    available: "دستیاب",
    overcrowded: "بھرا ہوا",
    damaged: "نقصان زدہ",
    critical: "نازک",
    high: "زیادہ",
    medium: "درمیانہ",
    stable: "مستحکم",
    warning: "انتباہ",
    simulationActive: "سمولیشن فعال",
    yes: "ہاں",
    no: "نہیں",
    bloodPressure: "بلڈ پریشر",
    pulse: "نبض",
    skill: "مہارت",
    currentTask: "موجودہ کام",
    status: "حالت",
    action: "عمل",
    fromConfig: "موجودہ آفت کی کنفیگ سے",
    statusStrip: "اسٹیٹس پٹی",
    eta: "وقت",
    km: "کلومیٹر",
    deployed: "تعینات",
    offline: "آف لائن",
    locating: "لوکیشن تلاش ہو رہی…",
    assignTask: "کام تفویض کریں",
  },
} as const;

export type TranslationKey = keyof typeof translations.en;

type LanguageContextValue = {
  language: Language;
  setLanguage: (lang: Language) => void;
  dir: "ltr" | "rtl";
  t: (key: TranslationKey) => string;
};

export const LanguageContext = createContext<LanguageContextValue | null>(null);

function isLanguage(value: unknown): value is Language {
  return value === "en" || value === "hi" || value === "ur";
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return isLanguage(stored) ? stored : "en";
    } catch {
      return "en";
    }
  });

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch {
      // ignore
    }
  }, []);

  const dir: "ltr" | "rtl" = language === "ur" ? "rtl" : "ltr";

  const t = useCallback(
    (key: TranslationKey) => {
      return translations[language][key] ?? translations.en[key];
    },
    [language]
  );

  const value = useMemo<LanguageContextValue>(() => ({ language, setLanguage, dir, t }), [
    language,
    setLanguage,
    dir,
    t,
  ]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within a LanguageProvider");
  return ctx;
}

