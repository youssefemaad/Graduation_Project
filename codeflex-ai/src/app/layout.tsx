"use client";

import Link from "next/link"; // Added Link import

import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { SubscriptionProvider } from "@/contexts/SubscriptionContext";
import { SignalRProvider } from "@/contexts/SignalRContext";
import { ToastProvider } from "@/components/ui/toast";
import { ThemeProvider } from "@/components/ThemeProvider";
import { usePathname } from "next/navigation";
import { NotificationListener } from "@/components/Notifications/NotificationListener";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Sidebar from "@/components/Sidebar";
import { BackgroundImage } from "@/components/BackgroundImage";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

function LayoutContent({ children }: { children: React.ReactNode }) {
  const { isRedirecting, isAuthenticated } = useAuth();
  const pathname = usePathname();

  if (isRedirecting) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
          <p className="text-muted-foreground">
            Redirecting to your dashboard...
          </p>
        </div>
      </div>
    );
  }

  // Hide nav on auth pages
  const isAuthPage =
    pathname &&
    (pathname.startsWith("/login") || pathname.startsWith("/signup"));

  if (isAuthPage) {
    return (
      <>
        {/* GRID BACKGROUND */}
        <div className="fixed inset-0 -z-1">
          <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-background"></div>
          <div className="absolute inset-0 bg-[linear-gradient(var(--cyber-grid-color)_1px,transparent_1px),linear-gradient(90deg,var(--cyber-grid-color)_1px,transparent_1px)] bg-[size:20px_20px]"></div>
        </div>
        <main className="flex-grow">{children}</main>
      </>
    );
  }

  // Authenticated Layout with Sidebar
  if (isAuthenticated) {
    return (
      <div className="flex min-h-screen bg-transparent">
        <BackgroundImage />
        {/* Sidebar (Desktop) */}
        <Sidebar />

        {/* Main Content Area */}
        <div className="flex-1 lg:pl-[240px] flex flex-col min-h-screen">
          {/* Mobile Header (Hidden on Desktop) */}
          <header className="lg:hidden h-14 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-700 flex items-center justify-between px-4 sticky top-0 z-40">
            <span className="font-bold text-lg text-slate-900 dark:text-white">
              Pulse<span className="text-blue-600">Gym</span>
            </span>
            {/* Mobile Menu Button would go here */}
          </header>

          {/* Page Content */}
          <main className="flex-1 p-3 md:p-6 pt-0">{children}</main>
        </div>

        <NotificationListener />
      </div>
    );
  }

  // Public Layout (Navbar for non-authenticated public pages if any)
  return (
    <>
      <Navbar />
      <NotificationListener />
      <div className="fixed inset-0 -z-1">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-background"></div>
        <div className="absolute inset-0 bg-[linear-gradient(var(--cyber-grid-color)_1px,transparent_1px),linear-gradient(90deg,var(--cyber-grid-color)_1px,transparent_1px)] bg-[size:20px_20px]"></div>
      </div>
      <main className="pt-24 flex-grow">{children}</main>
      <Footer />
    </>
  );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            <SubscriptionProvider>
              <ToastProvider>
                <SignalRProvider>
                  <LayoutContent>{children}</LayoutContent>
                </SignalRProvider>
              </ToastProvider>
            </SubscriptionProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
