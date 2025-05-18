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

const data = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
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
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <Link href="/">
                <IconInnerShadowTop className="!size-5" />
                <span className="text-base font-semibold">GTS Mktg.</span>
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
        <NavUser user={data.user} />
      </SidebarFooter>
    </Sidebar>
  )
}
