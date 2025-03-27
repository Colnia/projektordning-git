"use client"

import { useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Project } from "@/lib/types"
import { CalendarDays, AlertCircle, Clock, CheckCircle2 } from "lucide-react"
import { add, format, differenceInDays, isAfter, isBefore, parseISO } from "date-fns"
import { sv } from "date-fns/locale"

interface ProjectTimelineProps {
  projects: Project[]
}

export function ProjectTimeline({ projects }: ProjectTimelineProps) {
  // Filtrera pågående projekt och sortera efter deadline
  const activeProjects = useMemo(() => {
    const today = new Date()
    return projects
      .filter(project => project.status !== "Färdigt")
      .sort((a, b) => {
        const aDate = parseISO(a.plannedEndDate)
        const bDate = parseISO(b.plannedEndDate)
        return aDate.getTime() - bDate.getTime()
      })
      .slice(0, 5)
  }, [projects])

  return (
    <Card className="col-span-full">
      <CardHeader>
        <CardTitle className="flex items-center">
          <CalendarDays className="mr-2 h-5 w-5" />
          Projekttidslinjer
        </CardTitle>
        <CardDescription>Visualisering av projektets tidslinje och status</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {activeProjects.map(project => {
          const startDate = parseISO(project.startDate)
          const endDate = parseISO(project.plannedEndDate)
          const today = new Date()
          
          // Beräkna total projekttid i dagar
          const totalDays = differenceInDays(endDate, startDate) || 1
          
          // Beräkna hur många dagar som har gått sedan start
          const daysElapsed = differenceInDays(today, startDate)
          
          // Beräkna procentuellt slutförande baserat på tid
          const percentComplete = Math.min(100, Math.max(0, (daysElapsed / totalDays) * 100))
          
          // Kontrollera om projektet är försenat
          const isDelayed = project.status === "Försenat" || (isAfter(today, endDate) && project.status !== "Färdigt")
          
          // Beräkna budget progress
          const budgetUsedPercent = Math.round((project.costToDate / project.budget) * 100)
          
          // Beräkna återstående dagar
          const daysRemaining = differenceInDays(endDate, today)
          
          return (
            <div key={project.id} className="space-y-2">
              <div className="flex flex-col space-y-1 md:flex-row md:items-center md:justify-between md:space-y-0">
                <div>
                  <h3 className="font-medium">{project.name}</h3>
                  <p className="text-sm text-muted-foreground">{project.customer}</p>
                </div>
                
                <div className="flex items-center space-x-2">
                  {isDelayed ? (
                    <Badge variant="destructive" className="flex items-center">
                      <AlertCircle className="mr-1 h-3 w-3" />
                      Försenat
                    </Badge>
                  ) : daysRemaining <= 14 ? (
                    <Badge variant="warning" className="flex items-center">
                      <Clock className="mr-1 h-3 w-3" />
                      {daysRemaining} dagar kvar
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="flex items-center">
                      <Clock className="mr-1 h-3 w-3" />
                      {daysRemaining} dagar kvar
                    </Badge>
                  )}
                  
                  {budgetUsedPercent > 90 && (
                    <Badge variant={budgetUsedPercent > 100 ? "destructive" : "warning"}>
                      Budget: {budgetUsedPercent}%
                    </Badge>
                  )}
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span>{format(startDate, 'd MMM yyyy', { locale: sv })}</span>
                  <span>{format(endDate, 'd MMM yyyy', { locale: sv })}</span>
                </div>
                
                <div className="relative pt-1">
                  <Progress 
                    value={percentComplete} 
                    className={`h-2 ${isDelayed ? "bg-red-200" : ""}`}
                  />
                  <div 
                    className="absolute top-0 mt-1 h-4 w-0.5 bg-black dark:bg-white" 
                    style={{ 
                      left: `${Math.min(100, Math.max(0, percentComplete))}%`,
                      transform: 'translateX(-50%)'
                    }}
                  ></div>
                </div>
                
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Projektledare: {project.manager}</span>
                  <span>
                    Budget: {project.costToDate.toLocaleString('sv-SE')} kr / {project.budget.toLocaleString('sv-SE')} kr
                  </span>
                </div>
              </div>
            </div>
          )
        })}
        
        {activeProjects.length === 0 && (
          <div className="flex h-24 items-center justify-center rounded-md border border-dashed">
            <p className="text-sm text-muted-foreground">Inga aktiva projekt att visa</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
} 