"use client"

import React, { useCallback, useEffect, useRef, useState } from "react"
import {
  addDays,
  differenceInDays,
  format,
  isAfter,
  isBefore,
  parseISO,
  endOfMonth,
  addMonths,
  getMonth,
  getYear,
  eachMonthOfInterval,
  eachWeekOfInterval,
  eachDayOfInterval,
  isSameDay,
  startOfMonth,
} from "date-fns"
import { sv } from "date-fns/locale"
import {
  AlertCircle,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Flag,
  Link,
  Plus,
  Save,
  Search,
  Settings,
  ZoomIn,
  ZoomOut,
  ChevronDown,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Slider } from "@/components/ui/slider"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

// Types
type TaskStatus = "not-started" | "in-progress" | "completed" | "delayed" | "cancelled"
type TaskPriority = "low" | "medium" | "high" | "critical"
type TimeScale = "day" | "week" | "month" | "quarter" | "year"
type ViewMode = "standard" | "compact" | "detailed"

interface Phase {
  id: string
  name: string
  description?: string
  startDate: string | null
  endDate: string | null
  completionRate: number
  color?: string
  status?: string
}

interface Project {
  id: string
  name: string
  startDate: string
  plannedEndDate: string
  status: string
  phases?: Phase[]
}

// Anpassat interface för Gantt-chartet för att hantera data från vår API
interface GanttProjectData extends Project {
  isExpanded?: boolean
}

// Transformera vår API-data till dataformatet som komponenten förväntar sig
const transformApiProjects = (apiProjects: Project[]): GanttProjectData[] => {
  return apiProjects.map(project => ({
    ...project,
    isExpanded: false
  }))
}

interface GanttChartAdvancedProps {
  projects: Project[]
}

export default function GanttChartAdvanced({ projects }: GanttChartAdvancedProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [timeRange, setTimeRange] = useState<Date[]>([])
  const [timeScale, setTimeScale] = useState<TimeScale>("day")
  const [viewMode, setViewMode] = useState<ViewMode>("standard")
  const [searchQuery, setSearchQuery] = useState("")
  
  const [ganttProjects, setGanttProjects] = useState<GanttProjectData[]>([])
  const [selectedProject, setSelectedProject] = useState<string | null>(null)
  const [expandedProjects, setExpandedProjects] = useState<Record<string, boolean>>({})
  
  const [taskFormVisible, setTaskFormVisible] = useState(false)
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null)
  
  // Initiera projekten
  useEffect(() => {
    const transformedProjects = transformApiProjects(projects)
    setGanttProjects(transformedProjects)
    
    // Expandera alla projekt som standard
    const expanded: Record<string, boolean> = {}
    transformedProjects.forEach(project => {
      expanded[project.id] = true
    })
    setExpandedProjects(expanded)
  }, [projects])
  
  // Generera tidslinjen baserat på tidsskala och aktuell månad
  useEffect(() => {
    const generateTimeRange = () => {
      const start = startOfMonth(currentMonth)
      const end = endOfMonth(currentMonth)
      
      switch (timeScale) {
        case "day":
          return eachDayOfInterval({ start, end })
        case "week":
          return eachWeekOfInterval({ start, end }, { weekStartsOn: 1 })
        case "month":
          return eachMonthOfInterval({ start, end })
        default:
          return eachDayOfInterval({ start, end })
      }
    }
    
    setTimeRange(generateTimeRange())
  }, [currentMonth, timeScale])
  
  // Navigera mellan månader
  const goToPreviousMonth = () => {
    setCurrentMonth(prev => addMonths(prev, -1))
  }
  
  const goToNextMonth = () => {
    setCurrentMonth(prev => addMonths(prev, 1))
  }
  
  // Växla projektkollaps
  const toggleProject = (projectId: string) => {
    setExpandedProjects(prev => ({
      ...prev,
      [projectId]: !prev[projectId]
    }))
  }
  
  // Hantera klick på fas
  const handlePhaseClick = (projectId: string, phaseId: string) => {
    setSelectedProject(projectId)
    setActiveTaskId(phaseId)
    setTaskFormVisible(true)
  }
  
  // Beräkna position för en projektstapel
  const calculatePosition = (startDateStr: string | null, endDateStr: string | null) => {
    if (!timeRange.length || !startDateStr || !endDateStr) return { left: 0, width: 0, visible: false }
    
    const startDate = startDateStr ? new Date(startDateStr) : new Date()
    const endDate = endDateStr ? new Date(endDateStr) : new Date()
    
    // Om projektet är helt utanför nuvarande tidsperiod, visa inte
    if (endDate < timeRange[0] || startDate > timeRange[timeRange.length - 1]) {
      return { left: 0, width: 0, visible: false }
    }
    
    // Beräkna start relativt till tidslinjen
    const timelineStart = timeRange[0]
    const timelineEnd = timeRange[timeRange.length - 1]
    const timelineWidth = 100 // procent
    const timelineDuration = (timelineEnd.getTime() - timelineStart.getTime())
    
    // Klippa startdatum om det är tidigare än tidslinjens början
    const effectiveStart = startDate < timelineStart ? timelineStart : startDate
    // Klippa slutdatum om det är senare än tidslinjens slut
    const effectiveEnd = endDate > timelineEnd ? timelineEnd : endDate
    
    // Beräkna position och bredd i procent
    const left = ((effectiveStart.getTime() - timelineStart.getTime()) / timelineDuration) * timelineWidth
    const width = ((effectiveEnd.getTime() - effectiveStart.getTime()) / timelineDuration) * timelineWidth
    
    return { left, width, visible: true }
  }
  
  // Få CSS-klass baserat på projektstatus
  const getStatusClass = (status: string) => {
    switch (status.toLowerCase()) {
      case 'planering':
        return 'bg-blue-500'
      case 'pågående':
        return 'bg-green-500'
      case 'försenat':
        return 'bg-red-500'
      case 'färdigt':
        return 'bg-gray-500'
      case 'not-started':
        return 'bg-slate-400'
      case 'in-progress':
        return 'bg-emerald-500'
      case 'completed':
        return 'bg-purple-500'
      case 'delayed':
        return 'bg-amber-500'
      default:
        return 'bg-gray-300'
    }
  }
  
  // Öppna formulär för att skapa ny fas
  const handleAddPhase = (projectId: string) => {
    setSelectedProject(projectId)
    setActiveTaskId(null)
    setTaskFormVisible(true)
  }
  
  // Spara ny/uppdaterad fas
  const handleSavePhase = async (phaseData: any) => {
    try {
      const response = await fetch('/api/gantt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: activeTaskId ? 'update_task' : 'create_phase',
          ...phaseData
        }),
      })
      
      if (!response.ok) {
        throw new Error('Kunde inte spara fasen')
      }
      
      // Stäng formuläret och uppdatera projekten
      setTaskFormVisible(false)
      // Ladda om sidan för att få uppdaterad data
      window.location.reload()
    } catch (error) {
      console.error('Fel vid sparande av fas:', error)
      alert('Kunde inte spara fasen. Försök igen senare.')
    }
  }

  return (
    <div className="flex flex-col gap-4 min-h-[600px]">
      {/* Kontroller för navigering och inställningar */}
      <div className="flex flex-wrap justify-between items-center gap-4 mb-2">
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={goToPreviousMonth}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Föregående månad
          </Button>
          
          <span className="font-medium">
            {format(currentMonth, 'MMMM yyyy', { locale: sv })}
          </span>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={goToNextMonth}
          >
            Nästa månad
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
        
        <div className="flex items-center gap-2">
          <Input
            placeholder="Sök uppgifter..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-40 sm:w-60"
          />
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-1" />
                Visa
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setViewMode("standard")}>Standard</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setViewMode("compact")}>Kompakt</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setViewMode("detailed")}>Detaljerad</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setTimeScale("day")}>Dagvy</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTimeScale("week")}>Veckovis</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTimeScale("month")}>Månadsvis</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      
      {/* Gantt-schema */}
      <div className="border rounded-md bg-white">
        {/* Tidslinje huvud */}
        <div className="flex border-b">
          <div className="w-60 min-w-60 bg-muted border-r p-2">
            <span className="font-medium">Projekt / Faser</span>
          </div>
          <div className="flex-1 overflow-x-auto">
            <div className="flex min-w-full">
              {timeRange.map((day) => (
                <div 
                  key={day.toISOString()} 
                  className={cn(
                    "flex-1 text-center py-2 text-xs border-r last:border-r-0",
                    day.getDay() === 0 || day.getDay() === 6 ? "bg-muted/50" : ""
                  )}
                >
                  {timeScale === "day" ? format(day, 'd', { locale: sv }) : 
                   timeScale === "week" ? `V${format(day, 'w', { locale: sv })}` : 
                   format(day, 'MMM', { locale: sv })}
                </div>
              ))}
            </div>
          </div>
        </div>
        
        {/* Projekt och fas rader */}
        <div className="max-h-[500px] overflow-y-auto">
          {ganttProjects.length > 0 ? (
            ganttProjects.map((project) => {
              const { left, width, visible } = calculatePosition(project.startDate, project.plannedEndDate)
              const isExpanded = expandedProjects[project.id] || false
              
              return (
                <div key={project.id} className="group">
                  {/* Projektrad */}
                  <div 
                    className="flex border-b hover:bg-muted/20 transition-colors cursor-pointer"
                    onClick={() => toggleProject(project.id)}
                  >
                    <div className="w-60 min-w-60 border-r p-2 flex justify-between items-center">
                      <div>
                        <div className="font-medium flex items-center">
                          <span className="mr-1">{isExpanded ? '▼' : '▶'}</span>
                          {project.name}
                        </div>
                        <div className="text-xs text-muted-foreground flex items-center gap-1">
                          <span className={cn(
                            "inline-block w-2 h-2 rounded-full",
                            getStatusClass(project.status)
                          )}></span>
                          {project.status}
                        </div>
                      </div>
                      
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="opacity-0 group-hover:opacity-100 h-7 w-7"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleAddPhase(project.id)
                              }}
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Lägg till fas</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <div className="flex-1 relative h-16 min-w-0">
                      {visible && (
                        <div 
                          className={cn(
                            "absolute h-8 top-4 rounded-md shadow-sm cursor-pointer transition-opacity", 
                            getStatusClass(project.status),
                            "group-hover:opacity-90"
                          )}
                          style={{ 
                            left: `${left}%`, 
                            width: `${width}%`
                          }}
                          onClick={(e) => {
                            e.stopPropagation()
                          }}
                        >
                          <div className="px-2 py-1 text-xs text-white overflow-hidden whitespace-nowrap">
                            {project.name}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Fasrader om projektet är expanderat */}
                  {isExpanded && project.phases && project.phases.map((phase) => {
                    const phasePosition = calculatePosition(phase.startDate, phase.endDate)
                    if (!phasePosition.visible) return null
                    
                    return (
                      <div 
                        key={phase.id}
                        className="flex border-b last:border-b-0 bg-muted/5 hover:bg-muted/20 transition-colors"
                      >
                        <div className="w-60 min-w-60 border-r p-2 pl-6 flex justify-between items-center">
                          <div>
                            <div className="font-medium">{phase.name}</div>
                            <div className="text-xs text-muted-foreground">
                              {phase.completionRate}% färdig
                            </div>
                          </div>
                          
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="opacity-0 hover:opacity-100 h-7 w-7"
                            onClick={() => handlePhaseClick(project.id, phase.id)}
                          >
                            <Settings className="h-3 w-3" />
                          </Button>
                        </div>
                        <div className="flex-1 relative h-16 min-w-0">
                          <div 
                            className={cn(
                              "absolute h-6 top-5 rounded-md cursor-pointer"
                            )}
                            style={{ 
                              left: `${phasePosition.left}%`, 
                              width: `${phasePosition.width}%`,
                              backgroundColor: phase.color || "#6366f1"
                            }}
                            onClick={() => handlePhaseClick(project.id, phase.id)}
                          >
                            <div className="px-2 py-1 text-xs text-white overflow-hidden whitespace-nowrap">
                              {phase.name}
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )
            })
          ) : (
            <div className="flex border-b">
              <div className="w-60 min-w-60 border-r p-2">
                <span className="text-muted-foreground">Inga projekt</span>
              </div>
              <div className="flex-1 p-2">
                <span className="text-muted-foreground">Lägg till ett projekt för att se det i Gantt-schemat</span>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Modalt formulär för att redigera/skapa fas */}
      {taskFormVisible && (
        <Dialog open={taskFormVisible} onOpenChange={setTaskFormVisible}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>
                {activeTaskId ? 'Redigera fas' : 'Skapa ny fas'}
              </DialogTitle>
            </DialogHeader>
            
            <div className="py-4">
              <form className="space-y-4" onSubmit={(e) => {
                e.preventDefault()
                const formData = new FormData(e.currentTarget)
                const data = {
                  id: activeTaskId || undefined,
                  projectId: selectedProject,
                  name: formData.get('name') as string,
                  startDate: formData.get('startDate') as string,
                  endDate: formData.get('endDate') as string,
                  completionRate: parseInt(formData.get('completionRate') as string) || 0,
                  color: formData.get('color') as string
                }
                handleSavePhase(data)
              }}>
                <div className="space-y-2">
                  <Label htmlFor="name">Namn</Label>
                  <Input 
                    id="name" 
                    name="name" 
                    placeholder="Fasens namn" 
                    required 
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="startDate">Startdatum</Label>
                    <Input 
                      id="startDate" 
                      name="startDate" 
                      type="date" 
                      required 
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="endDate">Slutdatum</Label>
                    <Input 
                      id="endDate" 
                      name="endDate" 
                      type="date" 
                      required 
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="completionRate">Färdigställandegrad (%)</Label>
                  <Input 
                    id="completionRate" 
                    name="completionRate" 
                    type="number" 
                    min="0" 
                    max="100" 
                    defaultValue="0" 
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="color">Färg</Label>
                  <div className="flex gap-2">
                    <Input 
                      id="color" 
                      name="color" 
                      type="color" 
                      defaultValue="#6366f1" 
                      className="w-12 h-10 p-1" 
                    />
                    <Input 
                      name="colorHex" 
                      placeholder="#HEX" 
                      defaultValue="#6366f1" 
                      disabled 
                      className="flex-1" 
                    />
                  </div>
                </div>
                
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setTaskFormVisible(false)}>
                    Avbryt
                  </Button>
                  <Button type="submit">
                    {activeTaskId ? 'Uppdatera' : 'Skapa'}
                  </Button>
                </DialogFooter>
              </form>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
} 