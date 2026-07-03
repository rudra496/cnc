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

// Base site URL. Uses NEXT_PUBLIC_BASE_PATH-aware absolute URLs for SEO.
const SITE_URL = "https://rudra496.github.io/cnc";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "CNC Simulator Pro — Free 3D CNC Milling & G-code Simulator",
    template: "%s · CNC Simulator Pro",
  },
  description:
    "Free, browser-based 3-axis CNC milling simulator. Watch real material removal in 3D as G-code runs, with a DRO control bar, feeds & speeds calculator, 8-tool library, 26 example programs, and a full G/M-code reference. 100% client-side — no install.",
  applicationName: "CNC Simulator Pro",
  keywords: [
    "CNC simulator",
    "CNC simulator online",
    "G-code simulator",
    "G-code",
    "M-code",
    "CNC milling",
    "CNC milling simulator",
    "3D machining",
    "Fanuc",
    "CNC programming",
    "G-code visualizer",
    "react-three-fiber",
    "Three.js",
    "manufacturing simulation",
    "CAD CAM",
    "learn CNC",
  ],
  authors: [{ name: "Rudra Sarker", url: "https://github.com/rudra496" }],
  creator: "Rudra Sarker",
  publisher: "Rudra Sarker",
  category: "education",
  icons: {
    icon: [{ url: "/favicon.svg", type: "image/svg+xml" }],
    shortcut: "/favicon.svg",
    apple: "/favicon.svg",
  },
  manifest: "/site.webmanifest",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "CNC Simulator Pro — Free 3D CNC Milling & G-code Simulator",
    description:
      "Watch real material removal in 3D as your G-code runs. Free browser-based CNC milling simulator with DRO control bar, feeds & speeds calculator, tool library, and 26 example programs. No install — 100% client-side.",
    url: SITE_URL,
    siteName: "CNC Simulator Pro",
    type: "website",
    locale: "en_US",
    images: [
      {
        url: "/og-image.svg",
        width: 1280,
        height: 640,
        alt: "CNC Simulator Pro — 3D CNC Milling & G-code Simulator",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "CNC Simulator Pro — Free 3D CNC Milling & G-code Simulator",
    description:
      "Watch real material removal in 3D as your G-code runs. Free browser-based CNC simulator — no install needed.",
    images: ["/og-image.svg"],
    creator: "@rudra496",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
};

// JSON-LD structured data for richer search results.
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "CNC Simulator Pro",
  applicationCategory: "EducationalApplication",
  operatingSystem: "Any (web browser)",
  browserRequirements: "Requires a WebGL-capable browser",
  description:
    "Free, browser-based 3-axis CNC milling simulator with real-time 3D machining, G/M-code animation, DRO control bar, feeds & speeds calculator, tool library, and 26 example programs.",
  url: SITE_URL,
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
  featureList: [
    "High-fidelity 3D gantry VMC with real material removal",
    "Real-time G-code animation with current-line tracking",
    "DRO control bar with spindle, feed, and tool status",
    "Run / Dry Run / Machine Lock simulation modes",
    "Feed & speeds calculator with MRR and power estimates",
    "8-tool library (end mills, drills, ball nose, chamfer, face mill)",
    "8-material library with recommended cutting parameters",
    "26 ready-to-run example G-code programs",
    "65-code G/M/T/F/S/Z reference",
    "Save, load, export, and import programs locally",
  ],
  author: {
    "@type": "Person",
    name: "Rudra Sarker",
    url: "https://github.com/rudra496",
  },
  license: "https://github.com/rudra496/cnc/blob/main/LICENSE",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
