"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { LayoutDashboard, FolderClosed, FileText, BarChart, Users, Settings } from "lucide-react"

export function Navbar() {
  const pathname = usePathname()

  const managementNavItems = [
    {
      title: "Översikt",
      href: "/",
      icon: <LayoutDashboard className="w-4 h-4" />,
    },
    {
      title: "Projekt",
      href: "/planning",
      icon: <FolderClosed className="w-4 h-4" />,
    },
    {
      title: "Offerter",
      href: "/project",
      icon: <FileText className="w-4 h-4" />,
    },
  ]

  const planningNavItems = [
    {
      title: "Resurser",
      href: "/reports/resources",
      icon: <Users className="w-4 h-4" />,
    },
    {
      title: "Statistik",
      href: "/reports/stats",
      icon: <BarChart className="w-4 h-4" />,
    },
  ]

  return (
    <div className="group flex w-56 flex-col gap-4 border-e py-6">
      <div className="px-2">
        <Link
          href="/"
          className="flex items-center gap-2 px-2 py-1"
        >
          <div className="rounded bg-primary p-1 text-primary-foreground">
            <LayoutDashboard className="h-5 w-5" />
          </div>
          <div className="text-xl font-semibold tracking-tight">
            ProjektOrdning
          </div>
        </Link>
      </div>
      
      <div className="grid gap-1 px-2">
        <div className="text-xs uppercase text-muted-foreground px-2 py-2 border-b">
          Projekthantering
        </div>
        
        {managementNavItems.map((item) => (
          <Button
            key={item.href}
            variant={pathname === item.href ? "secondary" : "ghost"}
            className={cn(
              "justify-start gap-2",
              pathname === item.href && "bg-muted"
            )}
            asChild
          >
            <Link href={item.href}>
              {item.icon}
              {item.title}
            </Link>
          </Button>
        ))}
        
        <div className="text-xs uppercase text-muted-foreground px-2 py-2 mt-4 border-b">
          Rapporter
        </div>
        
        {planningNavItems.map((item) => (
          <Button
            key={item.href}
            variant={pathname === item.href ? "secondary" : "ghost"}
            className={cn(
              "justify-start gap-2",
              pathname === item.href && "bg-muted"
            )}
            asChild
          >
            <Link href={item.href}>
              {item.icon}
              {item.title}
            </Link>
          </Button>
        ))}
      </div>
      
      <div className="mt-auto grid gap-1 px-2">
        <Button
          variant="ghost"
          className="justify-start gap-2"
          asChild
        >
          <Link href="/settings">
            <Settings className="w-4 h-4" />
            Inställningar
          </Link>
        </Button>
      </div>
    </div>
  )
} 