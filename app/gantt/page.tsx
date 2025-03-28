"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { ChevronRight, Home, Loader2, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Header } from "@/components/header"
import GanttChart from "./components/GanttChart"

export default function GanttPage() {
  const [projects, setProjects] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setIsLoading(true)
        const response = await fetch('/api/gantt')
        
        if (!response.ok) {
          throw new Error('Kunde inte hämta projektdata')
        }
        
        const data = await response.json()
        setProjects(data.projects || [])
      } catch (error) {
        console.error('Fel vid hämtning av projekt:', error)
        setError('Kunde inte ladda projektdata. Försök igen senare.')
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchProjects()
  }, [])

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 bg-gray-50">
        <div className="container mx-auto p-6 space-y-6">
          {/* Breadcrumbs */}
          <div className="flex items-center text-sm text-muted-foreground">
            <Link href="/" className="flex items-center hover:text-foreground">
              <Home className="h-4 w-4 mr-1" />
            </Link>
            <ChevronRight className="h-4 w-4 mx-1" />
            <span className="font-medium text-foreground">Gantt-schema</span>
          </div>
          
          {/* Sidhuvud med titel och åtgärder */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <h1 className="text-2xl font-bold">Projektplanering</h1>
            <div className="flex gap-2">
              <Button asChild size="sm">
                <Link href="/projects">
                  Visa alla projekt
                </Link>
              </Button>
            </div>
          </div>
          
          {/* Huvudinnehåll */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Gantt-schema</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center items-center min-h-[400px]">
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-muted-foreground">Laddar projektdata...</p>
                  </div>
                </div>
              ) : error ? (
                <div className="flex justify-center items-center min-h-[400px]">
                  <div className="flex flex-col items-center gap-2 max-w-md text-center">
                    <p className="text-red-500">{error}</p>
                    <Button 
                      variant="outline" 
                      onClick={() => window.location.reload()}
                      className="mt-4"
                    >
                      Försök igen
                    </Button>
                  </div>
                </div>
              ) : (
                <GanttChart projects={projects} />
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
} 