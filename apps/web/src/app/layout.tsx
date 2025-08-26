import type { Metadata } from "next";
import "./globals.css";
import { Inter } from "next/font/google";
import { cn } from "@/lib/utils";
import { AssistantProvider } from "@/contexts/AssistantContext";
import { GraphProvider } from "@/contexts/GraphContext";
import { ThreadProvider } from "@/contexts/ThreadProvider";
import { NuqsAdapter } from "nuqs/adapters/next/app";

const inter = Inter({
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Open Canvas",
  description: "Open Canvas Chat UX by LangChain",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-screen">
      <body className={cn("min-h-full", inter.className)}>
        <NuqsAdapter>
          <ThreadProvider>
            <AssistantProvider>
              <GraphProvider>{children}</GraphProvider>
            </AssistantProvider>
          </ThreadProvider>
        </NuqsAdapter>
      </body>
    </html>
  );
}
