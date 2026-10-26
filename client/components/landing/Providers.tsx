"use client";
import { QueryClientProvider } from "@tanstack/react-query";
import { getQueryClient } from "@/lib/get-query-client";
import { MotionConfig } from "framer-motion";
import { ThemeProvider } from "next-themes";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem={false}
      disableTransitionOnChange
    >
      <QueryClientProvider client={getQueryClient()}>
        <MotionConfig
          reducedMotion="user"
          transition={{ duration: 0.2, ease: "easeOut" }}
        >
          <TooltipProvider delay={180}>
            {children}
            <Toaster position="bottom-right" richColors closeButton />
          </TooltipProvider>
        </MotionConfig>
      </QueryClientProvider>
    </ThemeProvider>
  );
}
