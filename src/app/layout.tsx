import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "RiskGuard CMC Strategy Skill",
  description: "Track 2 Strategy Skills demo for BNB HACK"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
