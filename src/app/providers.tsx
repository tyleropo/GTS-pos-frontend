"use client";

import React from "react";
import { ThemeProvider } from "@/src/components/theme-provider";
import { AuthProvider } from "@/src/providers/auth-provider";
import { Toaster } from "@/src/components/ui/sonner";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <AuthProvider>
        {children}
        <Toaster position="top-right" richColors />
      </AuthProvider>
    </ThemeProvider>
  );
}
