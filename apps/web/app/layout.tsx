import type { Metadata } from "next";
import "./globals.css";
import { SunriseBackground } from "@/components/glass/SunriseBackground";
import { Navbar } from "@/components/glass/Navbar";
import { HelperChatWidget } from "@/components/chat/HelperChatWidget";

export const metadata: Metadata = {
  title: "FoodRescue AI — Good food deserves a plate, not a bin",
  description:
    "Real-time surplus food rescue network connecting donors, verified NGOs, and volunteer riders in minutes.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700&family=Space+Grotesk:wght@500;700&display=swap"
        />
      </head>
      <body className="min-h-screen antialiased">
        <SunriseBackground />
        <Navbar />
        <main className="mx-auto max-w-7xl px-4 pb-24 pt-7">{children}</main>
        <HelperChatWidget />
      </body>
    </html>
  );
}
