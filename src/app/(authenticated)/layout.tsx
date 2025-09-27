import { AppSidebar } from '@/src/components/app-sidebar';
import { SidebarInset, SidebarProvider } from '@/src/components/ui/sidebar';
import React from 'react'

const layout = ({children}:  Readonly<{
  children: React.ReactNode;
}>) => {
   return (
           <SidebarProvider
       style={
         {
           "--sidebar-width": "calc(var(--spacing) * 72)",
           "--header-height": "calc(var(--spacing) * 12)",
         } as React.CSSProperties
       }
     >
       <AppSidebar variant="inset" />
       <SidebarInset>
          {children}

       </SidebarInset>
     </SidebarProvider>
   )
 }

export default layout