// apps/web/src/app/layout.tsx
import type { Metadata } from "next";
import { Plus_Jakarta_Sans, DM_Mono } from "next/font/google";
import "./globals.css";
import React from "react";
import AuthClientWrapper from '@/components/AuthClientWrapper';

// Load fonts
const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const dmMono = DM_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Podacium - Learn, Build, Analyze",
  description: "Multi-module platform for education, freelancing, and business intelligence",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${jakarta.className} ${dmMono.className}`}
      suppressHydrationWarning
    >
      <body
        style={{
          backgroundColor: "white",
          color: "black",
          fontFamily: `'Plus Jakarta Sans', sans-serif`,
          minHeight: "100vh",
          margin: 0,
          padding: 0,
          WebkitFontSmoothing: "antialiased",
          MozOsxFontSmoothing: "grayscale",
        }}
      >
        <AuthClientWrapper>
          <AuthVerifyingIndicator />
          <main>{children}</main>
        </AuthClientWrapper>
      </body>
    </html>
  );
}

// Inline component — you can move it to its own file if preferred
function AuthVerifyingIndicator() {
  return (
    <div className="fixed top-0 left-0 right-0 h-1 bg-blue-200 z-50">
      <div
        className="h-full bg-blue-600 animate-pulse transition-all duration-300"
        style={{ width: "100%" }}
      />
    </div>
  );
}
