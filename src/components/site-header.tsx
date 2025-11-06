import type { ReactNode } from "react"
import { Separator } from "@/src/components/ui/separator"
import { SidebarTrigger } from "@/src/components/ui/sidebar"

interface SiteHeaderProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}

export function SiteHeader({ title, subtitle, actions }: SiteHeaderProps) {
  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-3 border-b bg-background/95 px-4 backdrop-blur transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height) lg:px-6">
      <div className="flex flex-1 items-center gap-3">
        <SidebarTrigger className="-ml-2 lg:-ml-1" />
        <Separator orientation="vertical" className="hidden h-6 lg:block" />
        <div className="space-y-0.5">
          <h1 className="text-base font-semibold leading-none tracking-tight lg:text-lg">
            {title}
          </h1>
          {subtitle ? (
            <p className="text-xs text-muted-foreground lg:text-sm">
              {subtitle}
            </p>
          ) : null}
        </div>
      </div>
      <div className="ml-auto flex items-center gap-2">{actions}</div>
    </header>
  );
}
