"use client"

import React, { useEffect, useState } from "react"
import Link from "next/link"
import { notFound } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, Calendar, CalendarRange, CheckSquare, Clock, Edit, ListChecks, Users } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { GanttChart } from "@/components/gantt-chart"

// Tillfällig typ för projektdata
interface Project {
  id: string
  name: string
  description: string
  startDate: string
  plannedEndDate: string
  status: string
  phases?: Phase[]
  resources?: Resource[]
  milestones?: Milestone[]
  completionRate: number
}

interface Phase {
  id: string
  name: string
  startDate: string
  endDate: string
  completionRate: number
  color?: string
}

interface Resource {
  id: string
  name: string
  role: string
  availabilityPercentage: number
  color: string
}

interface Milestone {
  id: string
  name: string
  date: string
  completed: boolean
  description?: string
}

export default function ProjectPlanningPage({ params }: { params: { id: string } }) {
  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchProject() {
      try {
        setLoading(true)
        const response = await fetch(`/api/projects/${params.id}`)
        if (!response.ok) {
          if (response.status === 404) {
            return notFound()
          }
          throw new Error("Kunde inte hämta projektdata")
        }
        const data = await response.json()
        
        // Temporär mappning av data tills API är helt implementerat
        setProject({
          ...data,
          phases: data.phases || [],
          resources: data.resources || [],
          milestones: data.milestones || []
        })
      } catch (err) {
        console.error("Fel vid hämtning av projekt:", err)
        setError("Kunde inte ladda projektdata")
      } finally {
        setLoading(false)
      }
    }

    fetchProject()
  }, [params.id])

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[600px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (error || !project) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center mb-6">
          <Link href="/planning" className="text-primary hover:underline flex items-center">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Tillbaka till projektöversikt
          </Link>
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <h2 className="text-xl font-bold text-destructive mb-2">Kunde inte ladda projektet</h2>
              <p className="text-muted-foreground mb-4">{error || "Projektdata saknas"}</p>
              <Button onClick={() => window.location.reload()}>Försök igen</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center mb-6">
        <Link href="/planning" className="text-primary hover:underline flex items-center">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Tillbaka till projektöversikt
        </Link>
      </div>

      <div className="flex justify-between items-start mb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold">{project.name}</h1>
            <Badge className={getStatusBadgeClass(project.status)}>{project.status}</Badge>
          </div>
          <p className="text-muted-foreground mt-1">{project.description}</p>
        </div>
        <Button variant="outline" className="flex gap-2">
          <Edit className="h-4 w-4" />
          Redigera projekt
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-2">
                <Calendar className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-medium">Projektperiod</h3>
              <p className="text-sm text-muted-foreground">
                {formatDate(project.startDate)} - {formatDate(project.plannedEndDate)}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-2">
                <CheckSquare className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-medium">Färdigställande</h3>
              <div className="w-full mt-2">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-muted-foreground">Framsteg</span>
                  <span>{project.completionRate}%</span>
                </div>
                <Progress value={project.completionRate} className="h-2" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-2">
                <Clock className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-medium">Översikt</h3>
              <div className="grid grid-cols-3 gap-2 w-full mt-2">
                <div>
                  <p className="text-2xl font-bold">{project.phases?.length || 0}</p>
                  <p className="text-xs text-muted-foreground">Faser</p>
                </div>
                <div>
                  <p className="text-2xl font-bold">{project.resources?.length || 0}</p>
                  <p className="text-xs text-muted-foreground">Resurser</p>
                </div>
                <div>
                  <p className="text-2xl font-bold">{project.milestones?.length || 0}</p>
                  <p className="text-xs text-muted-foreground">Milstolpar</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="gantt" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="gantt" className="flex items-center gap-1">
            <CalendarRange className="h-4 w-4" />
            Gantt-schema
          </TabsTrigger>
          <TabsTrigger value="phases" className="flex items-center gap-1">
            <ListChecks className="h-4 w-4" />
            Faser
          </TabsTrigger>
          <TabsTrigger value="resources" className="flex items-center gap-1">
            <Users className="h-4 w-4" />
            Resurser
          </TabsTrigger>
        </TabsList>

        <TabsContent value="gantt" className="mt-0">
          <Card>
            <CardContent className="p-0 overflow-x-auto">
              <GanttChart />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="phases" className="mt-0">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Projektfaser</CardTitle>
                <Button size="sm">Lägg till fas</Button>
              </div>
              <CardDescription>Hantera projektets faser och deadlines</CardDescription>
            </CardHeader>
            <CardContent>
              {project.phases && project.phases.length > 0 ? (
                <div className="space-y-4">
                  {project.phases.map((phase) => (
                    <div key={phase.id} className="flex items-center justify-between border p-4 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-4 h-4 rounded-full" 
                          style={{ backgroundColor: phase.color || '#0891b2' }}
                        />
                        <div>
                          <h3 className="font-medium">{phase.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {formatDate(phase.startDate)} - {formatDate(phase.endDate)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="w-32">
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-xs text-muted-foreground">Framsteg</span>
                            <span className="text-xs">{phase.completionRate}%</span>
                          </div>
                          <Progress value={phase.completionRate} className="h-2" />
                        </div>
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <h3 className="text-lg font-medium mb-2">Inga faser tillagda ännu</h3>
                  <p className="text-muted-foreground mb-6">Lägg till faser för att börja planera projektet</p>
                  <Button>Lägg till första fasen</Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="resources" className="mt-0">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Resurser</CardTitle>
                <Button size="sm">Lägg till resurs</Button>
              </div>
              <CardDescription>Hantera resurser tilldelade till projektet</CardDescription>
            </CardHeader>
            <CardContent>
              {project.resources && project.resources.length > 0 ? (
                <div className="space-y-4">
                  {project.resources.map((resource) => (
                    <div key={resource.id} className="flex items-center justify-between border p-4 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-8 h-8 rounded-full flex items-center justify-center text-white" 
                          style={{ backgroundColor: resource.color }}
                        >
                          {resource.name.charAt(0)}
                        </div>
                        <div>
                          <h3 className="font-medium">{resource.name}</h3>
                          <p className="text-sm text-muted-foreground">{resource.role}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="text-sm">
                          <span>Tillgänglighet: </span>
                          <span className="font-medium">{resource.availabilityPercentage}%</span>
                        </div>
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <h3 className="text-lg font-medium mb-2">Inga resurser tilldelade ännu</h3>
                  <p className="text-muted-foreground mb-6">Lägg till resurser för att planera arbetet</p>
                  <Button>Lägg till första resursen</Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function getStatusBadgeClass(status: string) {
  const statusClasses: Record<string, string> = {
    'planering': 'bg-blue-500 hover:bg-blue-600',
    'pågående': 'bg-amber-500 hover:bg-amber-600',
    'färdigt': 'bg-green-500 hover:bg-green-600',
    'försenat': 'bg-red-500 hover:bg-red-600',
  }
  return statusClasses[status.toLowerCase()] || 'bg-gray-500 hover:bg-gray-600'
}

function formatDate(dateString: string) {
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('sv-SE', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  }).format(date)
} 