import type { ReactNode } from "react";

// Root layout: locale-specific <html> lives under app/[locale]/layout.tsx (next-intl).
export default function RootLayout({ children }: { children: ReactNode }) {
  return children;
}
