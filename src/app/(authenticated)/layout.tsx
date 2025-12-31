"use client";

import { useEffect } from "react";
import type { CSSProperties, ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AppSidebar } from "@/src/components/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/src/components/ui/sidebar";
import { Skeleton } from "@/src/components/ui/skeleton";
import { useAuth } from "@/src/providers/auth-provider";

type AuthenticatedLayoutProps = {
  children: ReactNode;
};

export default function AuthenticatedLayout({
  children,
}: AuthenticatedLayoutProps) {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuth();


  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.replace("/login");
      } else if (
        isAuthenticated &&
        user?.roles?.includes("cashier") &&
        !user?.roles?.includes("admin") &&
        !user?.roles?.includes("manager") &&
        !pathname.startsWith("/dashboard") &&
        !pathname.startsWith("/pos") &&
        !pathname.startsWith("/transactions") &&
        !pathname.startsWith("/repairs")
      ) {
        router.replace("/dashboard");
      } else if (
        isAuthenticated &&
        !user?.roles?.includes("admin") &&
        (pathname.startsWith("/users") ||
          pathname.startsWith("/reports") ||
          pathname.startsWith("/audit-logs"))
      ) {
        router.replace("/dashboard");
      }
    }
  }, [isAuthenticated, isLoading, router, user, pathname]);

  if (isLoading) {
    return (
      <div className="flex min-h-svh items-center justify-center p-6">
        <Skeleton className="h-32 w-full max-w-md rounded-2xl" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset>{children}</SidebarInset>
    </SidebarProvider>
  );
}
