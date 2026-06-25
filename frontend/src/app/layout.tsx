import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";
import { Suspense } from "react";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CONEX.in | B2B Cable & NDT Online Shop",
  description: "India's leading B2B e-commerce platform for industrial cables, custom connectors, and Non-Destructive Testing (NDT) gear. Request bulk quotes, calculate GSTIN orders, and manage dispatch tracking.",
  keywords: ["NDT testing", "industrial cables", "ultrasonic testing", "B2B shop India", "GST invoice", "magnaflux", "coaxial cables"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground selection:bg-primary/30 selection:text-foreground">
        <Suspense fallback={
          <header className="h-16 border-b border-border bg-background/90 backdrop-blur-md">
            <div className="mx-auto flex max-w-7xl h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
              <span className="text-xl font-bold tracking-tight text-primary">CONEX.in</span>
              <div className="h-8 w-8 animate-pulse bg-muted rounded-full"></div>
            </div>
          </header>
        }>
          <Header />
        </Suspense>
        
        <main className="flex-grow flex flex-col w-full">
          {children}
        </main>
        
        <Footer />
      </body>
    </html>
  );
}
