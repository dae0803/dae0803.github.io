import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { GoogleAnalytics } from "@/components/GoogleAnalytics";
import { GateKeeper } from "@/components/GateKeeper";
import { Sidebar } from "@/components/Sidebar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Eunmin Tech Portfolio",
  description: "Technical support and project portfolio for construction/design.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <GoogleAnalytics />
        <GateKeeper>
          <div className="flex min-h-screen bg-background">
            <Sidebar />
            <main className="flex-1 relative overflow-y-auto h-screen">
              <div className="container py-8">
                {children}
              </div>
            </main>
          </div>
        </GateKeeper>
      </body>
    </html>
  );
}
