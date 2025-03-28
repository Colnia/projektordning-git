"use client"

import { useState, useRef, useEffect } from "react"
import { format, addDays, startOfMonth, endOfMonth, eachDayOfInterval } from "date-fns"
import { sv } from "date-fns/locale"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, Plus } from "lucide-react"
import { cn } from "@/lib/utils"
import { TaskForm, TaskFormData } from "./TaskForm"

interface Project {
  id: string
  name: string
  startDate: string
  plannedEndDate: string
  status: string
  phases?: Phase[]
}

interface Phase {
  id: string
  name: string
  startDate: string | null
  endDate: string | null
  completionRate: number
  color: string | null
}

interface GanttChartProps {
  projects: Project[]
}

export default function GanttChart({ projects }: GanttChartProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [timeRange, setTimeRange] = useState<Date[]>([])
  const [selectedProject, setSelectedProject] = useState<string | null>(null)
  const [isTaskFormOpen, setIsTaskFormOpen] = useState(false)
  const [taskFormMode, setTaskFormMode] = useState<'create' | 'edit'>('create')
  const [selectedTask, setSelectedTask] = useState<TaskFormData | undefined>(undefined)
  const [expandedProjects, setExpandedProjects] = useState<Record<string, boolean>>({})
  const timelineRef = useRef<HTMLDivElement>(null)
  
  // Generera dagar för den synliga tidsperioden
  useEffect(() => {
    const start = startOfMonth(currentMonth)
    const end = endOfMonth(currentMonth)
    const days = eachDayOfInterval({ start, end })
    setTimeRange(days)
  }, [currentMonth])
  
  // Navigera mellan månader
  const goToPreviousMonth = () => {
    setCurrentMonth(prev => {
      const newDate = new Date(prev)
      newDate.setMonth(prev.getMonth() - 1)
      return newDate
    })
  }
  
  const goToNextMonth = () => {
    setCurrentMonth(prev => {
      const newDate = new Date(prev)
      newDate.setMonth(prev.getMonth() + 1)
      return newDate
    })
  }
  
  // Beräkna position för en projektstapel
  const calculatePosition = (startDateStr: string | null, endDateStr: string | null) => {
    if (!timeRange.length || !startDateStr || !endDateStr) return { left: 0, width: 0, visible: false }
    
    const startDate = new Date(startDateStr)
    const endDate = new Date(endDateStr)
    
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
  
  // Hantera klick på en fas eller projekt
  const handleItemClick = (item: any, type: 'project' | 'phase') => {
    const taskData: TaskFormData = {
      id: item.id,
      name: item.name,
      projectId: type === 'project' ? item.id : selectedProject || '',
      startDate: type === 'project' 
        ? new Date(item.startDate) 
        : (item.startDate ? new Date(item.startDate) : new Date()),
      endDate: type === 'project' 
        ? new Date(item.plannedEndDate) 
        : (item.endDate ? new Date(item.endDate) : new Date()),
      status: type === 'project' ? item.status : 'not-started'
    }
    
    setSelectedTask(taskData)
    setTaskFormMode('edit')
    setIsTaskFormOpen(true)
  }
  
  // Spara uppgift till servern
  const handleSaveTask = async (data: TaskFormData) => {
    try {
      console.log('Försöker spara:', data);
      
      const response = await fetch('/api/gantt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: taskFormMode === 'create' ? 'create_phase' : 'update_task',
          ...data
        }),
      })
      
      const responseData = await response.json();
      
      if (!response.ok) {
        console.error('Serverfel:', responseData);
        throw new Error(responseData.error || 'Kunde inte spara uppgiften');
      }
      
      // Stäng formuläret och ladda om projekten
      window.location.reload();
      return responseData;
    } catch (error) {
      console.error('Fel vid sparande av uppgift:', error);
      alert(`Kunde inte spara uppgiften: ${error instanceof Error ? error.message : 'Okänt fel'}`);
      throw error;
    }
  }
  
  // Växla projektkollaps
  const toggleProject = (projectId: string) => {
    setExpandedProjects(prev => ({
      ...prev,
      [projectId]: !prev[projectId]
    }))
    
    if (!expandedProjects[projectId]) {
      setSelectedProject(projectId)
    }
  }
  
  // Öppna formulär för att skapa ny uppgift
  const openNewTaskForm = () => {
    if (!selectedProject && projects.length > 0) {
      setSelectedProject(projects[0].id)
    }
    
    setSelectedTask(undefined)
    setTaskFormMode('create')
    setIsTaskFormOpen(true)
  }

  return (
    <div className="overflow-hidden">
      {/* Kontroller för navigering */}
      <div className="flex justify-between items-center mb-4">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={goToPreviousMonth}
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Föregående månad
        </Button>
        
        <h3 className="text-lg font-semibold">
          {format(currentMonth, 'MMMM yyyy', { locale: sv })}
        </h3>
        
        <Button 
          variant="outline" 
          size="sm" 
          onClick={goToNextMonth}
        >
          Nästa månad
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
      
      {/* Åtgärdsknapp för att lägga till uppgift */}
      <div className="mb-4">
        <Button 
          size="sm" 
          onClick={openNewTaskForm}
          className="gap-1"
        >
          <Plus className="h-4 w-4" />
          Lägg till fas
        </Button>
      </div>
      
      <div className="border rounded-md">
        {/* Tidslinje huvud */}
        <div className="flex border-b">
          <div className="w-48 min-w-48 bg-muted border-r p-2">
            <span className="font-medium">Projekt / Faser</span>
          </div>
          <div className="flex-1 relative" ref={timelineRef}>
            <div className="flex">
              {timeRange.map((day) => (
                <div 
                  key={day.toISOString()} 
                  className={cn(
                    "flex-1 text-center py-2 text-xs border-r last:border-r-0",
                    day.getDay() === 0 || day.getDay() === 6 ? "bg-muted/50" : ""
                  )}
                >
                  {format(day, 'd')}
                </div>
              ))}
            </div>
          </div>
        </div>
        
        {/* Projekt och fas rader */}
        <div className="max-h-[500px] overflow-y-auto">
          {projects.length > 0 ? (
            projects.map((project) => {
              const { left, width, visible } = calculatePosition(project.startDate, project.plannedEndDate)
              const isExpanded = expandedProjects[project.id] || false
              
              return (
                <div key={project.id} className="group">
                  {/* Projektrad */}
                  <div 
                    className="flex border-b hover:bg-muted/20 transition-colors cursor-pointer"
                    onClick={() => toggleProject(project.id)}
                  >
                    <div className="w-48 min-w-48 border-r p-2 truncate">
                      <div className="font-medium flex items-center">
                        <span className="mr-1">{isExpanded ? '▼' : '▶'}</span>
                        {project.name}
                      </div>
                      <div className="text-xs text-muted-foreground">{project.status}</div>
                    </div>
                    <div className="flex-1 relative h-16">
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
                            handleItemClick(project, 'project')
                          }}
                        />
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
                        <div className="w-48 min-w-48 border-r p-2 pl-6 truncate">
                          <div className="font-medium">{phase.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {phase.completionRate}% färdig
                          </div>
                        </div>
                        <div className="flex-1 relative h-16">
                          <div 
                            className={cn(
                              "absolute h-6 top-5 rounded-md cursor-pointer",
                              phase.color ? "" : "bg-indigo-500" 
                            )}
                            style={{ 
                              left: `${phasePosition.left}%`, 
                              width: `${phasePosition.width}%`,
                              backgroundColor: phase.color || undefined
                            }}
                            onClick={() => handleItemClick(phase, 'phase')}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              )
            })
          ) : (
            <div className="flex border-b">
              <div className="w-48 min-w-48 border-r p-2">
                <span className="text-muted-foreground">Inga projekt</span>
              </div>
              <div className="flex-1 p-2">
                <span className="text-muted-foreground">Lägg till ett projekt för att se det i Gantt-schemat</span>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Task Form Modal */}
      {isTaskFormOpen && (
        <TaskForm
          isOpen={isTaskFormOpen}
          onClose={() => setIsTaskFormOpen(false)}
          onSubmit={handleSaveTask}
          task={selectedTask}
          projectId={selectedProject || (projects.length > 0 ? projects[0].id : '')}
          mode={taskFormMode}
        />
      )}
    </div>
  )
} 