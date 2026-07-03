import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CNC Simulator Pro — 3D Milling & G-code Simulator",
  description:
    "A professional browser-based CNC simulator with high-fidelity 3D machining, real-time G-code animation, a powerful control bar, and full G/M/T/F/S/Z code reference. Learn CNC programming visually.",
  keywords: [
    "CNC simulator",
    "G-code",
    "M-code",
    "CNC milling",
    "3D machining",
    "Fanuc",
    "CNC programming",
    "react-three-fiber",
  ],
  authors: [{ name: "CNC Simulator Pro" }],
  icons: {
    icon: "https://z-cdn.chatglm.cn/z-ai/static/logo.svg",
  },
  openGraph: {
    title: "CNC Simulator Pro",
    description: "3D CNC milling simulator with real-time G-code animation",
    siteName: "CNC Simulator Pro",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "CNC Simulator Pro",
    description: "3D CNC milling simulator with real-time G-code animation",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
