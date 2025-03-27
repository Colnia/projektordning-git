"use client"

import { ThemeProvider } from "@/components/theme-provider"
import { ClientPlanningProvider } from "@/app/contexts/ClientPlanningContext"
import { ReactNode } from "react"

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="light">
      <ClientPlanningProvider>
        {children}
      </ClientPlanningProvider>
    </ThemeProvider>
  )
} 