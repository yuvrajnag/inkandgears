import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Orbitron, Caveat } from "next/font/google";
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

/*
 * Orbitron is the mark's face — the Figma file sets every piece of chrome and
 * every heading in Orbitron ExtraBold. Body copy and field labels are
 * Sansation there, which isn't distributable through next/font; Geist stands
 * in for it until the real file is licensed and self-hosted.
 */
const orbitron = Orbitron({
  variable: "--font-orbitron",
  subsets: ["latin"],
  weight: ["400", "500", "700", "800", "900"],
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
      className={`${geistSans.variable} ${geistMono.variable} ${orbitron.variable} ${caveat.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-void text-ink">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
