import type { Metadata } from "next";
import type { ReactNode } from "react";
import {
  Newsreader,
  Plus_Jakarta_Sans,
  JetBrains_Mono,
} from "next/font/google";
import "./globals.css";

const newsreader = Newsreader({
  subsets: ["latin"],
  variable: "--font-serif",
  display: "swap",
  weight: ["500", "600", "700"],
});

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "VERITAS // Archival Vector RAG & Citation Study Desk",
  description:
    "Full-Stack Retrieval-Augmented Generation system combining dense vector embeddings, hybrid BM25 search, and citation-linked academic synthesis for students.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en"
      className={`${newsreader.variable} ${plusJakarta.variable} ${jetbrainsMono.variable}`}
    >
      <body className="bg-[#FAF8F5] text-[#18181B] font-sans antialiased selection:bg-[#FEF3C7] selection:text-[#18181B]">
        {children}
      </body>
    </html>
  );
}
