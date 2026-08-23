import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { PRISM_SCHOOL_NAME, PRISM_TAGLINE } from "@/components/school/brand";
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
  title: `${PRISM_SCHOOL_NAME} — ${PRISM_TAGLINE}`,
  description: `${PRISM_SCHOOL_NAME} combines strong academic foundations with technology, creativity, and real-world learning.`,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
