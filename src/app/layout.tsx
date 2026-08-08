import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Baloo_2, Caveat } from "next/font/google";
import "./globals.css";
import { AppShell } from "@/components/chrome/AppShell";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const baloo = Baloo_2({
  variable: "--font-baloo",
  subsets: ["latin"],
  weight: ["600", "700", "800"],
});

const caveat = Caveat({
  variable: "--font-caveat",
  subsets: ["latin"],
  weight: ["600", "700"],
});

export const metadata: Metadata = {
  title: "INK & GEARS",
  description:
    "A narrative creation platform — writing, worldbuilding, and story-flow planning in one connected system.",
};

export const viewport: Viewport = {
  themeColor: "#000000",
  colorScheme: "dark",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${baloo.variable} ${caveat.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-void text-ink">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
