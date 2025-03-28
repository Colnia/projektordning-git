"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Briefcase, LayoutDashboard, BarChart3, Settings, Menu, CalendarRange, Home, FolderClosed, FileText, BarChart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"

export function Navbar() {
  const pathname = usePathname()
  
  // Navigationsalternativ
  const navItems = [
    { name: 'Översikt', href: '/', icon: <Home className="w-4 h-4" /> },
    { name: 'Projekt', href: '/projects', icon: <FolderClosed className="w-4 h-4" /> },
    { name: 'Offerter', href: '/quotes', icon: <FileText className="w-4 h-4" /> },
    { name: 'Gantt-schema', href: '/gantt', icon: <BarChart className="w-4 h-4" /> },
    { name: 'Avancerad Gantt', href: '/gantt-aktuell', icon: <CalendarRange className="w-4 h-4" /> },
    { name: 'Inställningar', href: '/settings', icon: <Settings className="w-4 h-4" /> }
  ];

  return (
    <div className="border-b">
      <div className="flex h-16 items-center px-4 md:px-8">
        <div className="hidden items-center space-x-4 md:flex">
          <Link href="/" className="flex items-center space-x-2">
            <span className="text-xl font-bold">ProjektOrdning</span>
          </Link>
        </div>
        
        <Sheet>
          <SheetTrigger asChild className="md:hidden">
            <Button variant="outline" size="icon" className="ml-2">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Meny</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[240px] sm:w-[300px]">
            <nav className="flex flex-col gap-4 mt-8">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
                    pathname === item.href ? "bg-accent text-accent-foreground" : "transparent"
                  )}
                >
                  {item.icon}
                  {item.name}
                </Link>
              ))}
            </nav>
          </SheetContent>
        </Sheet>

        <div className="hidden md:flex md:flex-1 md:justify-center">
          <nav className="flex items-center space-x-6">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2 text-sm font-medium transition-colors hover:text-primary",
                  pathname === item.href ? "text-primary" : "text-muted-foreground"
                )}
              >
                {item.icon}
                {item.name}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex flex-1 items-center justify-end space-x-4">
          <div className="flex items-center space-x-2">
            {/* Användarikon eller profilmeny kan läggas till här */}
          </div>
        </div>
      </div>
    </div>
  )
} 