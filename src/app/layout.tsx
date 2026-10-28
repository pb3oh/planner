import type { Metadata } from "next";
import { Outfit, DM_Mono } from "next/font/google";
import "./globals.css";
import { Nav } from "@/components/Nav";
import { CLBar } from "@/components/cl/CLBar";
import { Providers } from "@/components/Providers";
import { HierarchyProvider } from "@/components/HierarchyProvider";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
});

const dmMono = DM_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-dm-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Planner",
  description: "Dependency Planner — intake, plan, and inbox for spec-driven work",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${outfit.variable} ${dmMono.variable} h-full`} suppressHydrationWarning>
      <body className="h-full flex flex-col bg-slate-50 font-outfit antialiased">
        <Providers>
          <HierarchyProvider>
            <Nav />
            <main className="flex-1 overflow-y-auto pb-28">
              {children}
            </main>
            <CLBar />
          </HierarchyProvider>
        </Providers>
      </body>
    </html>
  );
}
