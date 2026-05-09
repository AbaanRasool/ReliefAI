import type { Metadata } from "next";
import { DisasterProvider } from "@/context/DisasterContext";
import { LanguageProvider } from "@/context/LanguageContext";
import Navbar from "@/components/Navbar";
import BodyDir from "@/components/BodyDir";
import DemoModeBadge from "@/components/DemoModeBadge";
import "./globals.css";

export const metadata: Metadata = {
  title: "ReliefAI — AI Disaster Response",
  description: "AI-powered disaster health and community response system",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <LanguageProvider>
          <BodyDir />
          <DisasterProvider>
            <Navbar />
            <div className="flex flex-1 flex-col pt-[104px]">{children}</div>
            <DemoModeBadge />
          </DisasterProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
