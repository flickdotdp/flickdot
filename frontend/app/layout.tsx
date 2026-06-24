import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "react-hot-toast";

// Providers
import QueryProvider from "../providers/query-provider";
import WebSocketProvider from "../providers/websocket-provider";

import "./globals.css";

// ----------------------------------------------------------------------------
// Font Configuration
// ----------------------------------------------------------------------------
const inter = Inter({ 
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

// ----------------------------------------------------------------------------
// Metadata & SEO
// ----------------------------------------------------------------------------
export const metadata: Metadata = {
  title: "Local AI Image Generator",
  description: "Premium AI Image Generation Platform powered by ComfyUI",
  keywords: ["AI", "Image Generation", "ComfyUI", "Local", "Stable Diffusion"],
  authors: [{ name: "Local User" }],
  openGraph: {
    title: "Local AI Image Generator",
    description: "Premium AI Image Generation Platform",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#101820", // Deep Space Black
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

// ----------------------------------------------------------------------------
// Root Layout
// ----------------------------------------------------------------------------
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} bg-background text-foreground antialiased min-h-screen overflow-x-hidden selection:bg-primary/30 selection:text-primary-foreground`}>
        
        {/* Animated Background Effect */}
        <div className="fixed inset-0 pointer-events-none z-[-1] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-background to-background" />

        {/* 
          ========================================================================
          GLOBAL PROVIDER TREE
          Order matters: QueryProvider first so WebSocketProvider has access to 
          the queryClient for cache invalidations.
          ========================================================================
        */}
        <QueryProvider>
          <WebSocketProvider>
            <main className="relative flex flex-col min-h-screen w-full">
              {children}
            </main>
          </WebSocketProvider>
        </QueryProvider>

        {/* Global Notification Toaster */}
        <Toaster 
          position="bottom-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#182430',
              color: '#f8fafc',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(12px)',
            },
            success: {
              iconTheme: {
                primary: '#00F0FF',
                secondary: '#101820',
              },
            },
            error: {
              style: { border: '1px solid rgba(239, 68, 68, 0.5)' }
            }
          }}
        />

        {/* Modal / Drawer Portals */}
        <div id="modal-root" />
        <div id="drawer-root" />
        
      </body>
    </html>
  );
}
