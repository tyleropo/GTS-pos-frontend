"use client"

import * as React from "react"
import {
  IconDashboard,
  IconInnerShadowTop,
  IconSettings,
  IconShoppingCart,
  IconPackage,
  IconHistory,
  IconUsers,
  IconFileText,
  IconDeviceImacCog,
  IconReceipt,
} from "@tabler/icons-react"


import { NavMain } from "@/src/components/nav-main"
import { NavSecondary } from "@/src/components/nav-secondary"
import { NavUser } from "@/src/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/src/components/ui/sidebar"
import Link from "next/link"
import { useAuth } from "@/src/providers/auth-provider"
import { APP_NAME } from "@/src/lib/config"

const data = {
  navMain: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: IconDashboard,
    },
    {
      title: "POS",
      url: "/pos",
      icon: IconShoppingCart,
    },
    {
      title: "Inventory",
      url: "/inventory",
      icon: IconPackage,
    },
    {
      title: "Transactions",
      url: "/transactions",
      icon: IconHistory,
    },
    {
      title: "Customers",
      url: "/customers",
      icon: IconUsers,
    },
    {
      title: "Billing",
      url: "/billing",
      icon: IconReceipt,
    },
    {
      title: "Purchase Orders",
      url: "/purchase-orders",
      icon: IconFileText,
    },
    {
      title: "Repairs",
      url: "/repairs",
      icon: IconDeviceImacCog,
    },
  ],
  navSecondary: [
    {
      title: "Settings",
      url: "/settings",
      icon: IconSettings,
    },
  ],

}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user, logout } = useAuth()
  const sidebarUser = React.useMemo(
    () =>
      user
        ? {
          name: `${user.first_name} ${user.last_name}`,
          email: user.email,
          avatar: null as string | null,
        }
        : undefined,
    [user]
  )

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <Link href="/dashboard">
                <IconInnerShadowTop className="!size-5" />
                <span className="text-base font-semibold">{APP_NAME}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={sidebarUser} onLogout={logout} />
      </SidebarFooter>
    </Sidebar>
  )
}
