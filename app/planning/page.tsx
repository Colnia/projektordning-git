"use client"

import React, { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CalendarRange, ListChecks, Users, ChevronRight, Clock } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { format, differenceInDays } from "date-fns"
import { sv } from "date-fns/locale"

// Tillfällig typ för projektdata
interface Project {
  id: string
  name: string
  description: string
  startDate: string
  plannedEndDate: string
  status: string
  phaseCount?: number
  completionRate: number
  resourceCount?: number
}

export default function PlanningPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchProjects() {
      try {
        setLoading(true)
        const response = await fetch("/api/projects")
        if (!response.ok) {
          throw new Error("Kunde inte hämta projektdata")
        }
        const data = await response.json()
        setProjects(data.projects || [])
      } catch (err) {
        console.error("Fel vid hämtning av projekt:", err)
        setError("Kunde inte ladda projektdata")
      } finally {
        setLoading(false)
      }
    }

    fetchProjects()
  }, [])

  function getStatusColor(status: string): string {
    const statusMap: Record<string, string> = {
      'planering': 'bg-blue-500',
      'pågående': 'bg-amber-500',
      'färdigt': 'bg-green-500',
      'försenat': 'bg-red-500',
    }
    return statusMap[status.toLowerCase()] || 'bg-gray-500'
  }

  function calculateDaysLeft(endDate: string): number {
    const today = new Date()
    const end = new Date(endDate)
    return Math.max(0, differenceInDays(end, today))
  }

  return (
    <div className="container mx-auto py-6 space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Projektplanering</h1>
        <Button>Skapa nytt projekt</Button>
      </div>

      <Tabs defaultValue="active" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="active">Aktiva projekt</TabsTrigger>
          <TabsTrigger value="planning">Planeringsfas</TabsTrigger>
          <TabsTrigger value="completed">Avslutade</TabsTrigger>
          <TabsTrigger value="all">Alla projekt</TabsTrigger>
        </TabsList>

        {loading ? (
          <div className="flex justify-center p-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : error ? (
          <div className="text-center p-12">
            <p className="text-red-500">{error}</p>
            <Button variant="outline" className="mt-4" onClick={() => window.location.reload()}>
              Försök igen
            </Button>
          </div>
        ) : (
          <TabsContent value="active" className="mt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.filter(p => p.status.toLowerCase() === 'pågående').map((project) => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>
          </TabsContent>
        )}

        <TabsContent value="planning" className="mt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.filter(p => p.status.toLowerCase() === 'planering').map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="completed" className="mt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.filter(p => p.status.toLowerCase() === 'färdigt').map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="all" className="mt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function ProjectCard({ project }: { project: Project }) {
  const daysLeft = calculateDaysLeft(project.plannedEndDate)
  
  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg font-semibold">{project.name}</CardTitle>
          <Badge 
            className={`${getStatusColor(project.status)} text-white`}
          >
            {project.status}
          </Badge>
        </div>
        <CardDescription className="line-clamp-2">{project.description}</CardDescription>
      </CardHeader>
      <CardContent className="pb-3">
        <div className="space-y-4">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Framsteg</span>
            <span className="font-medium">{project.completionRate}%</span>
          </div>
          <Progress value={project.completionRate} className="h-2" />
          
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div className="flex items-center gap-2">
              <CalendarRange className="w-4 h-4 text-muted-foreground" />
              <div className="text-sm">
                <p className="text-muted-foreground">Startdatum</p>
                <p className="font-medium">{format(new Date(project.startDate), 'd MMM yyyy', { locale: sv })}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <div className="text-sm">
                <p className="text-muted-foreground">Dagar kvar</p>
                <p className="font-medium">{daysLeft}</p>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <ListChecks className="w-4 h-4 text-muted-foreground" />
              <div className="text-sm">
                <p className="text-muted-foreground">Faser</p>
                <p className="font-medium">{project.phaseCount || 0}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-muted-foreground" />
              <div className="text-sm">
                <p className="text-muted-foreground">Resurser</p>
                <p className="font-medium">{project.resourceCount || 0}</p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-end pt-3">
        <Button asChild variant="outline" size="sm">
          <Link href={`/planning/${project.id}`}>
            Planera
            <ChevronRight className="ml-1 h-4 w-4" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  )
}

function getStatusColor(status: string): string {
  const statusMap: Record<string, string> = {
    'planering': 'bg-blue-500',
    'pågående': 'bg-amber-500',
    'färdigt': 'bg-green-500',
    'försenat': 'bg-red-500',
  }
  return statusMap[status.toLowerCase()] || 'bg-gray-500'
}

function calculateDaysLeft(endDate: string): number {
  const today = new Date()
  const end = new Date(endDate)
  return Math.max(0, differenceInDays(end, today))
} 