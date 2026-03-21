import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import { TopNav } from "@/components/common/nav";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "paste.trade",
    template: "%s",
  },
  description: "Receipts for trade calls",
  openGraph: {
    title: "paste.trade",
    description: "Receipts for trade calls",
    images: ["/og.svg"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} dark h-full antialiased`}>
      <body className="min-h-full bg-zinc-950 text-zinc-100 flex flex-col">
        <TopNav />
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">{children}</main>
        <footer className="border-t border-zinc-800 py-4 text-center text-xs text-zinc-500">
          Built by @nikkaroraa · <Link href="https://github.com/nikkaroraa/paste-trade" target="_blank" className="hover:text-zinc-300">GitHub</Link>
        </footer>
      </body>
    </html>
  );
}
