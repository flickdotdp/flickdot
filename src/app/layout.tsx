import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "FASTTV | Premium OTT Platform",
  description: "Next-generation streaming ecosystem ready for global audiences.",
};

import { Sidebar } from "@/components/layout/Sidebar";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} h-full antialiased dark`}
    >
      <body className="min-h-full flex bg-fast-black text-fast-text">
        <Sidebar />
        <main className="flex-1 w-full max-w-full overflow-x-hidden flex flex-col min-h-screen relative">
          {children}
        </main>
      </body>
    </html>
  );
}
