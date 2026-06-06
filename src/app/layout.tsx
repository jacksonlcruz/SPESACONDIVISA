import type { Metadata, Viewport } from "next";
import { Urbanist } from "next/font/google";
import { Toaster } from "react-hot-toast";
import Providers from "./Providers";
import "./globals.css";

const urbanist = Urbanist({ subsets: ["latin"], display: "swap", variable: "--font-urbanist" });

export const metadata: Metadata = {
  title: "Spesa Condivisa",
  description: "Lista della spesa collaborativa in tempo reale",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Spesa Condivisa",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#09090b",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it" className={`${urbanist.variable} font-sans`}>
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body className="bg-surface-900 antialiased">
        <Providers>
          {/* Container mobile-first: max 430px centrado em telas maiores */}
          <div className="relative min-h-screen max-w-[430px] mx-auto shadow-2xl bg-surface-900">
            {children}
          </div>
        </Providers>
        <Toaster
          position="top-center"
          toastOptions={{
            style: {
              borderRadius: "16px",
              fontSize: "14px",
              fontWeight: "500",
              background: "#27272a",
              color: "#f4f4f5",
              border: "1px solid #3f3f46",
            },
          }}
        />
      </body>
    </html>
  );
}
