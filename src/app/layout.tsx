import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
  title: "SITREP",
  description: "Global intelligence command center dashboard.",
  // iOS home-screen app: full-screen launch and its own title. Opaque status
  // bar ("black"), not "black-translucent" — translucent would draw the
  // status bar over the top bar, which has no top safe-area padding.
  appleWebApp: { capable: true, title: "SITREP", statusBarStyle: "black" },
};

export const viewport: Viewport = {
  themeColor: "#0a1022",
  // Without viewport-fit=cover, env(safe-area-inset-*) is always 0, so the
  // mobile bottom nav's iPhone home-indicator padding never applied.
  viewportFit: "cover",
  // Pinch-zoom deliberately left enabled (accessibility).
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex h-full flex-col overflow-hidden">{children}</body>
    </html>
  );
}
