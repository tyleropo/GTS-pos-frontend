"use client"

import * as React from "react"
import {
  IconDashboard,
  IconInnerShadowTop,
  IconShoppingCart,
  IconUsers,
  IconFileText,
  IconUserCog,
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
      title: "Operations",
      icon: IconShoppingCart,
      items: [
        { title: "POS", url: "/pos" },
        { title: "Inventory", url: "/inventory" },
        { title: "Transactions", url: "/transactions" },
        { title: "Repairs and Services", url: "/repairs" },
      ],
    },
    {
      title: "Contacts",
      icon: IconUsers,
      items: [
        { title: "Customers", url: "/customers" },
        { title: "Suppliers", url: "/suppliers" },
      ],
    },
    {
      title: "Orders & Billing",
      icon: IconFileText,
      items: [
        { title: "Customer Orders", url: "/customer-orders" },
        { title: "Purchases", url: "/purchase-orders" },
        { title: "Billing", url: "/billing" },
        { title: "Payments", url: "/payments" },
      ],
    },

    {
      title: "Administration",
      icon: IconUserCog,
      adminOnly: true,
      items: [
        { title: "Users", url: "/users" },
        { title: "Employees", url: "/employees" },
        { title: "Reports", url: "/reports" },
        { title: "Audit Logs", url: "/audit-logs" },
        { title: "Payroll", url: "/payroll" },
      ],
    },
  ],
  navSecondary: [],

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

        <NavMain
          items={
            user?.roles?.includes("admin")
              ? data.navMain
              : user?.roles?.includes("cashier") &&
                !user?.roles?.includes("manager")
              ? data.navMain
                  .filter((item) =>
                    ["Dashboard", "Operations", "Contacts", "Orders & Billing"].includes(item.title)
                  )
                  .map((item) => ({
                    ...item,
                    items: item.items?.filter((subItem) =>
                      ["POS", "Transactions", "Repairs and Services", "Customers", "Customer Orders", "Billing"].includes(subItem.title)
                    ),
                  }))
              : data.navMain
                  .map((item) => {
                    if (
                      user?.roles?.includes("manager") &&
                      item.title === "Administration"
                    ) {
                      return {
                        ...item,
                        adminOnly: false,
                        items: item.items?.filter(
                          (sub) => ["Payroll", "Employees"].includes(sub.title)
                        ),
                      }
                    }
                    return item
                  })
                  .filter((item) => !(item as { adminOnly?: boolean }).adminOnly)
          }
        />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={sidebarUser} onLogout={logout} />
      </SidebarFooter>
    </Sidebar>
  )
}
