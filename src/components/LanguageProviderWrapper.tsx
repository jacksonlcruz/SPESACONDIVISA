"use client";

import { type ReactNode } from "react";
import { LanguageProvider } from "@/contexts/LanguageContext";

// ──────────────────────────────────────────────────────────
// Wrapper Client Component para prover o LanguageContext
// no RootLayout (Server Component).
// ──────────────────────────────────────────────────────────
export default function LanguageProviderWrapper({ children }: { children: ReactNode }) {
  return <LanguageProvider>{children}</LanguageProvider>;
}