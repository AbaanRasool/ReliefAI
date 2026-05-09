import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { DisasterProvider } from "@/context/DisasterContext";
import Navbar from "@/components/Navbar";
import DemoModeBadge from "@/components/DemoModeBadge";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

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
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <DisasterProvider>
          <Navbar />
          <div className="flex flex-1 flex-col pt-[104px]">{children}</div>
          <DemoModeBadge />
        </DisasterProvider>
      </body>
    </html>
  );
}
