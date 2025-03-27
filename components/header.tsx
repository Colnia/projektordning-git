"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { Menu, Database } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { useState } from "react"

export function Header() {
  const router = useRouter()
  const [sheetOpen, setSheetOpen] = useState(false)

  // Förenkla navigeringen genom att bara använda URL-parametrar
  const navigateTo = (tabName: string) => {
    router.push(`/?tab=${tabName}`)
    if (sheetOpen) setSheetOpen(false)
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white">
      <div className="container flex h-16 items-center px-6">
        <div className="flex items-center gap-2 md:gap-4">
          <Link href="/" className="flex items-center space-x-2">
            <Database className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">Projektordning</span>
          </Link>
          <nav className="hidden md:flex gap-6 ml-6">
            <Link 
              href="/?tab=overview" 
              className="text-sm font-medium transition-colors hover:text-primary"
            >
              Översikt
            </Link>
            <Link 
              href="/?tab=projects" 
              className="text-sm font-medium transition-colors hover:text-primary"
            >
              Projekt
            </Link>
            <Link 
              href="/?tab=quotes" 
              className="text-sm font-medium transition-colors hover:text-primary"
            >
              Offerter
            </Link>
            <Link 
              href="/?tab=archived" 
              className="text-sm font-medium transition-colors hover:text-primary"
            >
              Arkiv
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-2 ml-auto">
          <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="outline" size="icon" className="h-9 w-9">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Öppna meny</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right">
              <nav className="flex flex-col gap-4 mt-8">
                <Link 
                  href="/?tab=overview"
                  className="text-base font-medium transition-colors hover:text-primary"
                  onClick={() => setSheetOpen(false)}
                >
                  Översikt
                </Link>
                <Link 
                  href="/?tab=projects"
                  className="text-base font-medium transition-colors hover:text-primary"
                  onClick={() => setSheetOpen(false)}
                >
                  Projekt
                </Link>
                <Link 
                  href="/?tab=quotes"
                  className="text-base font-medium transition-colors hover:text-primary"
                  onClick={() => setSheetOpen(false)}
                >
                  Offerter
                </Link>
                <Link 
                  href="/?tab=archived"
                  className="text-base font-medium transition-colors hover:text-primary"
                  onClick={() => setSheetOpen(false)}
                >
                  Arkiv
                </Link>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
} 