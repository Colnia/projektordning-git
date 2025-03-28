"use client"

import React from "react"

import { useCallback, useEffect, useRef, useState, useMemo } from "react"
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
  subMonths,
  startOfMonth,
  endOfWeek,
  isWeekend,
  isToday,
  addWeeks,
  getWeeksInMonth,
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

interface Resource {
  id: string
  name: string
  role: string
  avatar?: string
  availability: number // percentage
  color: string
}

interface Dependency {
  fromTaskId: string
  toTaskId: string
  type: "finish-to-start" | "start-to-start" | "finish-to-finish" | "start-to-finish"
}

// Uppdatera Task-interfacet för att stödja hierarkisk struktur
interface Task {
  id: string
  name: string
  description?: string
  startDate: string
  endDate: string
  progress: number
  status: TaskStatus
  priority: TaskPriority
  resources: string[]
  dependencies: Dependency[]
  parentId?: string
  milestoneId?: string
  color?: string
  collapsed?: boolean
  isPhase?: boolean // Ny egenskap för att markera om uppgiften är en fas/projekt
  subTasks?: string[] // Ny egenskap för att hålla reda på underuppgifter
}

interface Milestone {
  id: string
  name: string
  date: string
  color?: string
}

// Uppdatera Project-interfacet för att stödja flera projekt
interface Project {
  id: string
  name: string
  startDate: string
  endDate: string
  tasks: Task[]
  milestones: Milestone[]
  resources: Resource[]
  color?: string
  progress?: number
  description?: string
}

// Lägg till dessa nya typer efter de befintliga typerna
type TimeScale = "day" | "week" | "month" | "quarter" | "year"
type ViewMode = "standard" | "compact" | "detailed"

// Uppdatera sampleProject för att inkludera faser och underuppgifter
const sampleProject: Project = {
  id: "proj-1",
  name: "Webbplats Redesign",
  startDate: "2025-04-01",
  endDate: "2025-07-15",
  tasks: [
    {
      id: "phase-1",
      name: "Planering & Analys",
      description: "Definiera projektets omfattning och mål",
      startDate: "2025-04-01",
      endDate: "2025-04-14",
      progress: 100,
      status: "completed",
      priority: "high",
      resources: ["res-1", "res-2"],
      dependencies: [],
      color: "#4338ca",
      isPhase: true,
      subTasks: ["task-1-1", "task-1-2"],
    },
    {
      id: "task-1-1",
      name: "Kravanalys",
      description: "Samla in och dokumentera krav från intressenter",
      startDate: "2025-04-01",
      endDate: "2025-04-07",
      progress: 100,
      status: "completed",
      priority: "high",
      resources: ["res-2"],
      dependencies: [],
      parentId: "phase-1",
      color: "#4338ca",
    },
    {
      id: "task-1-2",
      name: "Projektplanering",
      description: "Skapa detaljerad projektplan och tidslinjer",
      startDate: "2025-04-08",
      endDate: "2025-04-14",
      progress: 100,
      status: "completed",
      priority: "high",
      resources: ["res-1"],
      dependencies: [{ fromTaskId: "task-1-1", toTaskId: "task-1-2", type: "finish-to-start" }],
      parentId: "phase-1",
      color: "#4338ca",
    },
    {
      id: "phase-2",
      name: "Design",
      description: "Skapa wireframes och designkoncept",
      startDate: "2025-04-15",
      endDate: "2025-05-15",
      progress: 70,
      status: "in-progress",
      priority: "high",
      resources: ["res-3"],
      dependencies: [{ fromTaskId: "phase-1", toTaskId: "phase-2", type: "finish-to-start" }],
      color: "#0891b2",
      isPhase: true,
      subTasks: ["task-2-1", "task-2-2", "task-2-3"],
    },
    {
      id: "task-2-1",
      name: "Wireframes",
      description: "Skapa lågupplösta wireframes för alla sidor",
      startDate: "2025-04-15",
      endDate: "2025-04-25",
      progress: 100,
      status: "completed",
      priority: "medium",
      resources: ["res-3"],
      dependencies: [],
      parentId: "phase-2",
      color: "#0891b2",
    },
    {
      id: "task-2-2",
      name: "UI Design",
      description: "Skapa högupplösta designkompositioner",
      startDate: "2025-04-26",
      endDate: "2025-05-10",
      progress: 80,
      status: "in-progress",
      priority: "high",
      resources: ["res-3"],
      dependencies: [{ fromTaskId: "task-2-1", toTaskId: "task-2-2", type: "finish-to-start" }],
      parentId: "phase-2",
      color: "#0891b2",
    },
    {
      id: "task-2-3",
      name: "Designgranskning",
      description: "Granska och godkänna designen med intressenter",
      startDate: "2025-05-11",
      endDate: "2025-05-15",
      progress: 0,
      status: "not-started",
      priority: "high",
      resources: ["res-1", "res-3"],
      dependencies: [{ fromTaskId: "task-2-2", toTaskId: "task-2-3", type: "finish-to-start" }],
      parentId: "phase-2",
      color: "#0891b2",
    },
    {
      id: "phase-3",
      name: "Frontend-utveckling",
      description: "Implementera designen med HTML, CSS och JavaScript",
      startDate: "2025-05-01",
      endDate: "2025-06-15",
      progress: 30,
      status: "in-progress",
      priority: "medium",
      resources: ["res-4", "res-5"],
      dependencies: [{ fromTaskId: "phase-2", toTaskId: "phase-3", type: "start-to-start" }],
      color: "#0d9488",
      isPhase: true,
      subTasks: ["task-3-1", "task-3-2", "task-3-3"],
    },
    {
      id: "task-3-1",
      name: "HTML-struktur",
      description: "Implementera HTML-struktur för alla sidor",
      startDate: "2025-05-01",
      endDate: "2025-05-15",
      progress: 90,
      status: "in-progress",
      priority: "medium",
      resources: ["res-4"],
      dependencies: [],
      parentId: "phase-3",
      color: "#0d9488",
    },
    {
      id: "task-3-2",
      name: "CSS-styling",
      description: "Implementera CSS-styling enligt designen",
      startDate: "2025-05-10",
      endDate: "2025-05-31",
      progress: 50,
      status: "in-progress",
      priority: "medium",
      resources: ["res-5"],
      dependencies: [{ fromTaskId: "task-3-1", toTaskId: "task-3-2", type: "start-to-start" }],
      parentId: "phase-3",
      color: "#0d9488",
    },
    {
      id: "task-3-3",
      name: "JavaScript-funktionalitet",
      description: "Implementera interaktiv funktionalitet med JavaScript",
      startDate: "2025-05-20",
      endDate: "2025-06-15",
      progress: 10,
      status: "in-progress",
      priority: "high",
      resources: ["res-4", "res-5"],
      dependencies: [{ fromTaskId: "task-3-2", toTaskId: "task-3-3", type: "start-to-start" }],
      parentId: "phase-3",
      color: "#0d9488",
    },
    {
      id: "phase-4",
      name: "Backend-utveckling",
      description: "Implementera serverlogik och databas",
      startDate: "2025-05-10",
      endDate: "2025-06-30",
      progress: 20,
      status: "in-progress",
      priority: "high",
      resources: ["res-6"],
      dependencies: [{ fromTaskId: "phase-1", toTaskId: "phase-4", type: "finish-to-start" }],
      color: "#0369a1",
      isPhase: true,
      subTasks: ["task-4-1", "task-4-2", "task-4-3"],
    },
    {
      id: "task-4-1",
      name: "API-design",
      description: "Designa API-endpoints och datamodeller",
      startDate: "2025-05-10",
      endDate: "2025-05-20",
      progress: 100,
      status: "completed",
      priority: "high",
      resources: ["res-6"],
      dependencies: [],
      parentId: "phase-4",
      color: "#0369a1",
    },
    {
      id: "task-4-2",
      name: "Databasimplementation",
      description: "Skapa databasschema och migrationer",
      startDate: "2025-05-21",
      endDate: "2025-06-10",
      progress: 50,
      status: "in-progress",
      priority: "high",
      resources: ["res-6"],
      dependencies: [{ fromTaskId: "task-4-1", toTaskId: "task-4-2", type: "finish-to-start" }],
      parentId: "phase-4",
      color: "#0369a1",
    },
    {
      id: "task-4-3",
      name: "API-implementation",
      description: "Implementera API-endpoints och affärslogik",
      startDate: "2025-06-01",
      endDate: "2025-06-30",
      progress: 0,
      status: "not-started",
      priority: "high",
      resources: ["res-6"],
      dependencies: [{ fromTaskId: "task-4-2", toTaskId: "task-4-3", type: "start-to-start" }],
      parentId: "phase-4",
      color: "#0369a1",
    },
    {
      id: "phase-5",
      name: "Testning",
      description: "Utför enhets- och integrationstester",
      startDate: "2025-06-15",
      endDate: "2025-07-05",
      progress: 0,
      status: "not-started",
      priority: "medium",
      resources: ["res-4", "res-7"],
      dependencies: [
        { fromTaskId: "phase-3", toTaskId: "phase-5", type: "finish-to-start" },
        { fromTaskId: "phase-4", toTaskId: "phase-5", type: "finish-to-start" },
      ],
      color: "#7c3aed",
      isPhase: true,
      subTasks: ["task-5-1", "task-5-2"],
    },
    {
      id: "task-5-1",
      name: "Enhetstester",
      description: "Skriv och kör enhetstester för alla komponenter",
      startDate: "2025-06-15",
      endDate: "2025-06-25",
      progress: 0,
      status: "not-started",
      priority: "medium",
      resources: ["res-4", "res-7"],
      dependencies: [],
      parentId: "phase-5",
      color: "#7c3aed",
    },
    {
      id: "task-5-2",
      name: "Integrationstester",
      description: "Utför integrationstester för hela systemet",
      startDate: "2025-06-26",
      endDate: "2025-07-05",
      progress: 0,
      status: "not-started",
      priority: "high",
      resources: ["res-7"],
      dependencies: [{ fromTaskId: "task-5-1", toTaskId: "task-5-2", type: "finish-to-start" }],
      parentId: "phase-5",
      color: "#7c3aed",
    },
    {
      id: "phase-6",
      name: "Lansering",
      description: "Driftsätt webbplatsen i produktion",
      startDate: "2025-07-06",
      endDate: "2025-07-15",
      progress: 0,
      status: "not-started",
      priority: "critical",
      resources: ["res-1", "res-6"],
      dependencies: [{ fromTaskId: "phase-5", toTaskId: "phase-6", type: "finish-to-start" }],
      color: "#be123c",
      isPhase: true,
      subTasks: ["task-6-1", "task-6-2"],
    },
    {
      id: "task-6-1",
      name: "Driftsättning",
      description: "Driftsätt webbplatsen i produktionsmiljön",
      startDate: "2025-07-06",
      endDate: "2025-07-10",
      progress: 0,
      status: "not-started",
      priority: "critical",
      resources: ["res-6"],
      dependencies: [],
      parentId: "phase-6",
      color: "#be123c",
    },
    {
      id: "task-6-2",
      name: "Lansering och uppföljning",
      description: "Officiell lansering och uppföljning av feedback",
      startDate: "2025-07-11",
      endDate: "2025-07-15",
      progress: 0,
      status: "not-started",
      priority: "high",
      resources: ["res-1"],
      dependencies: [{ fromTaskId: "task-6-1", toTaskId: "task-6-2", type: "finish-to-start" }],
      parentId: "phase-6",
      color: "#be123c",
    },
  ],
  milestones: [
    {
      id: "ms-1",
      name: "Design godkänd",
      date: "2025-05-15",
      color: "#0891b2",
    },
    {
      id: "ms-2",
      name: "Utveckling klar",
      date: "2025-06-30",
      color: "#0369a1",
    },
    {
      id: "ms-3",
      name: "Lansering",
      date: "2025-07-15",
      color: "#be123c",
    },
  ],
  resources: [
    {
      id: "res-1",
      name: "Anna Svensson",
      role: "Projektledare",
      avatar: "/placeholder.svg?height=40&width=40",
      availability: 100,
      color: "#4338ca",
    },
    {
      id: "res-2",
      name: "Erik Johansson",
      role: "Affärsanalytiker",
      avatar: "/placeholder.svg?height=40&width=40",
      availability: 80,
      color: "#0891b2",
    },
    {
      id: "res-3",
      name: "Maria Lindberg",
      role: "UX Designer",
      avatar: "/placeholder.svg?height=40&width=40",
      availability: 100,
      color: "#0d9488",
    },
    {
      id: "res-4",
      name: "Johan Karlsson",
      role: "Frontend-utvecklare",
      avatar: "/placeholder.svg?height=40&width=40",
      availability: 100,
      color: "#0369a1",
    },
    {
      id: "res-5",
      name: "Sofia Nilsson",
      role: "Frontend-utvecklare",
      avatar: "/placeholder.svg?height=40&width=40",
      availability: 80,
      color: "#7c3aed",
    },
    {
      id: "res-6",
      name: "Anders Pettersson",
      role: "Backend-utvecklare",
      avatar: "/placeholder.svg?height=40&width=40",
      availability: 100,
      color: "#be123c",
    },
    {
      id: "res-7",
      name: "Lisa Andersson",
      role: "QA-testare",
      avatar: "/placeholder.svg?height=40&width=40",
      availability: 60,
      color: "#ca8a04",
    },
  ],
}

// Lägg till ett andra exempelprojekt i sampleProject-arrayen
const sampleProjects: Project[] = [
  sampleProject,
  {
    id: "proj-2",
    name: "Mobilapp-utveckling",
    startDate: "2025-05-01",
    endDate: "2025-08-15",
    description: "Utveckling av en mobilapp för iOS och Android",
    color: "#7c3aed",
    progress: 30,
    tasks: [
      {
        id: "phase-2-1",
        name: "Kravanalys",
        description: "Definiera appens funktionalitet och användarkrav",
        startDate: "2025-05-01",
        endDate: "2025-05-15",
        progress: 100,
        status: "completed",
        priority: "high",
        resources: ["res-1", "res-2"],
        dependencies: [],
        color: "#7c3aed",
        isPhase: true,
        subTasks: [],
      },
      {
        id: "phase-2-2",
        name: "Design",
        description: "Skapa UI/UX-design för appen",
        startDate: "2025-05-16",
        endDate: "2025-06-15",
        progress: 70,
        status: "in-progress",
        priority: "high",
        resources: ["res-3"],
        dependencies: [{ fromTaskId: "phase-2-1", toTaskId: "phase-2-2", type: "finish-to-start" }],
        color: "#7c3aed",
        isPhase: true,
        subTasks: [],
      },
      {
        id: "phase-2-3",
        name: "Utveckling",
        description: "Implementera appens funktionalitet",
        startDate: "2025-06-16",
        endDate: "2025-07-31",
        progress: 10,
        status: "in-progress",
        priority: "high",
        resources: ["res-4", "res-5"],
        dependencies: [{ fromTaskId: "phase-2-2", toTaskId: "phase-2-3", type: "finish-to-start" }],
        color: "#7c3aed",
        isPhase: true,
        subTasks: [],
      },
      {
        id: "phase-2-4",
        name: "Testning",
        description: "Testa appen på olika enheter",
        startDate: "2025-07-15",
        endDate: "2025-08-10",
        progress: 0,
        status: "not-started",
        priority: "medium",
        resources: ["res-7"],
        dependencies: [{ fromTaskId: "phase-2-3", toTaskId: "phase-2-4", type: "start-to-start" }],
        color: "#7c3aed",
        isPhase: true,
        subTasks: [],
      },
      {
        id: "phase-2-5",
        name: "Lansering",
        description: "Publicera appen i App Store och Google Play",
        startDate: "2025-08-11",
        endDate: "2025-08-15",
        progress: 0,
        status: "not-started",
        priority: "critical",
        resources: ["res-1"],
        dependencies: [{ fromTaskId: "phase-2-4", toTaskId: "phase-2-5", type: "finish-to-start" }],
        color: "#7c3aed",
        isPhase: true,
        subTasks: [],
      },
    ],
    milestones: [
      {
        id: "ms-2-1",
        name: "Design godkänd",
        date: "2025-06-15",
        color: "#7c3aed",
      },
      {
        id: "ms-2-2",
        name: "Beta-version klar",
        date: "2025-07-31",
        color: "#7c3aed",
      },
      {
        id: "ms-2-3",
        name: "Lansering",
        date: "2025-08-15",
        color: "#7c3aed",
      },
    ],
    resources: sampleProject.resources, // Använd samma resurser som i första projektet
  },
]

// Helper functions
const getTaskWidth = (task: Task, dayWidth: number, startDate: Date): number => {
  const start = parseISO(task.startDate)
  const end = parseISO(task.endDate)
  const days = differenceInDays(end, start) + 1
  return days * dayWidth
}

const getTaskLeft = (task: Task, dayWidth: number, startDate: Date): number => {
  const taskStart = parseISO(task.startDate)
  const days = differenceInDays(taskStart, startDate)
  return days * dayWidth
}

const getStatusColor = (status: TaskStatus): string => {
  switch (status) {
    case "not-started":
      return "bg-slate-400"
    case "in-progress":
      return "bg-blue-500"
    case "completed":
      return "bg-green-500"
    case "delayed":
      return "bg-amber-500"
    case "cancelled":
      return "bg-red-500"
    default:
      return "bg-slate-400"
  }
}

const getPriorityColor = (priority: TaskPriority): string => {
  switch (priority) {
    case "low":
      return "bg-slate-400"
    case "medium":
      return "bg-blue-500"
    case "high":
      return "bg-amber-500"
    case "critical":
      return "bg-red-500"
    default:
      return "bg-slate-400"
  }
}

// Uppdatera GanttChart-komponenten för att hantera flera projekt
// Uppdatera GanttChart-komponenten för att använda sampleProjects
export function GanttChart() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [activeProject, setActiveProject] = useState<string | null>(null)
  const [project, setProject] = useState<Project | null>(null)
  const [viewStartDate, setViewStartDate] = useState<Date>(new Date())
  const [viewEndDate, setViewEndDate] = useState<Date>(addMonths(new Date(), 3))
  const [currentView, setCurrentView] = useState<"projects" | "project" | "phase">("projects")
  const [currentPhase, setCurrentPhase] = useState<string | null>(null)
  const [timeScale, setTimeScale] = useState<TimeScale>("day")
  const [viewMode, setViewMode] = useState<ViewMode>("standard")
  const [searchTerm, setSearchTerm] = useState<string>("")
  const [isAddingProject, setIsAddingProject] = useState<boolean>(false)
  const [isAddingPhase, setIsAddingPhase] = useState<boolean>(false)
  const [isAddingTask, setIsAddingTask] = useState<boolean>(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [isTaskModalOpen, setIsTaskModalOpen] = useState<boolean>(false)
  const [dayWidth, setDayWidth] = useState<number>(40)
  const [draggingTask, setDraggingTask] = useState<string | null>(null)
  const [resizingTask, setResizingTask] = useState<{ id: string; edge: "start" | "end" } | null>(null)
  const [isMultiSelecting, setIsMultiSelecting] = useState<boolean>(false)
  const [selectedTask, setSelectedTask] = useState<string | null>(null)
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set())
  const [contextMenuPosition, setContextMenuPosition] = useState<{ x: number; y: number } | null>(null)
  const [contextMenuTaskId, setContextMenuTaskId] = useState<string | null>(null)
  const [newTask, setNewTask] = useState<Partial<Task>>({
    name: "",
    startDate: format(new Date(), "yyyy-MM-dd"),
    endDate: format(addDays(new Date(), 7), "yyyy-MM-dd"),
    progress: 0,
    status: "not-started",
    priority: "medium",
    resources: [],
    dependencies: [],
  })
  
  // Lägg till saknade variabler
  const [expandedProjects, setExpandedProjects] = useState<Record<string, boolean>>({})
  const [breadcrumbs, setBreadcrumbs] = useState<
    { id: string; name: string; type: "projects" | "project" | "phase" }[]
  >([{ id: "projects", name: "Alla projekt", type: "projects" }])
  
  // Lägg till refs för scrollning
  const ganttRef = useRef<HTMLDivElement>(null)
  const timelineRef = useRef<HTMLDivElement>(null)
  
  // Define currentMonth variable for navigation
  const currentMonth = viewStartDate || new Date()
  
  // Beräkna antal dagar i månaden för grid
  const daysInMonth = differenceInDays(
    endOfMonth(currentMonth),
    startOfMonth(currentMonth)
  ) + 1;
  
  // Funktion för att beräkna den totala höjden baserat på antal rader
  const calculateTotalRowsHeight = () => {
    let height = 0;
    
    projects.forEach(project => {
      // Lägg till höjd för projektraden
      height += 40;
      
      // Om projektet är expanderat, lägg till höjd för varje fas
      if (expandedProjects[project.id] && project.tasks) {
        height += project.tasks.length * 40;
      }
    });
    
    return `${Math.max(height, 200)}px`;
  };

  // Hämta projekt från vår API
  useEffect(() => {
    const fetchProjects = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const response = await fetch("/api/gantt");
        
        if (!response.ok) {
          throw new Error("Kunde inte hämta projektdata");
        }
        
        const data = await response.json();
        console.log("Hämtade projektdata:", data);
        
        if (data.projects && data.projects.length > 0) {
          // Konvertera vår API-data till formatet som Gantt-komponenten använder
          const formattedProjects: Project[] = data.projects.map((apiProject: any) => {
            // Skapa ett korrekt formaterat projekt
            return {
              id: apiProject.id,
              name: apiProject.name,
              startDate: apiProject.startDate,
              endDate: apiProject.plannedEndDate,
              description: apiProject.description || "",
              color: "#0891b2",
              progress: 0,
              tasks: apiProject.phases ? apiProject.phases.map((phase: any) => ({
                id: phase.id,
                name: phase.name,
                description: phase.description || "",
                startDate: phase.startDate || apiProject.startDate,
                endDate: phase.endDate || apiProject.plannedEndDate,
                progress: phase.completionRate || 0,
                status: mapStatus(apiProject.status),
                priority: "medium",
                resources: [],
                dependencies: [],
                color: phase.color || "#0891b2",
                isPhase: true,
                subTasks: []
              })) : [],
              milestones: [],
              resources: []
            };
          });
          
          setProjects(formattedProjects);
          
          // Sätt första projektet som aktivt om det finns
          if (formattedProjects.length > 0) {
            setActiveProject(formattedProjects[0].id);
            setProject(formattedProjects[0]);
            setViewStartDate(parseISO(formattedProjects[0].startDate));
            setViewEndDate(parseISO(formattedProjects[0].endDate));
          } else {
            console.log("Inga projekt returnerades från API, använder exempeldata");
            setProjects(sampleProjects);
            setActiveProject(sampleProjects[0].id);
            setProject(sampleProjects[0]);
            setViewStartDate(parseISO(sampleProjects[0].startDate));
            setViewEndDate(parseISO(sampleProjects[0].endDate));
          }
        } else {
          console.log("Inga projekt returnerades från API, använder exempeldata");
          // Fallback till sample data om det inte finns några projekt
          setProjects(sampleProjects);
          setActiveProject(sampleProjects[0].id);
          setProject(sampleProjects[0]);
          setViewStartDate(parseISO(sampleProjects[0].startDate));
          setViewEndDate(parseISO(sampleProjects[0].endDate));
        }
      } catch (err) {
        console.error("Fel vid hämtning av projekt:", err);
        setError("Kunde inte hämta projektdata");
        console.log("Använder exempeldata på grund av fel");
        // Fallback till sample data vid fel
        setProjects(sampleProjects);
        setActiveProject(sampleProjects[0].id);
        setProject(sampleProjects[0]);
        setViewStartDate(parseISO(sampleProjects[0].startDate));
        setViewEndDate(parseISO(sampleProjects[0].endDate));
      } finally {
        setLoading(false);
      }
    };
    
    fetchProjects();
  }, []);
  
  // Hjälpfunktion för att mappa vår status till Gantt-komponentens format
  const mapStatus = (status: string): TaskStatus => {
    const statusMap: Record<string, TaskStatus> = {
      'planering': 'not-started',
      'pågående': 'in-progress',
      'färdigt': 'completed',
      'försenat': 'delayed',
      'cancelled': 'cancelled'
    };
    
    return statusMap[status.toLowerCase()] || 'not-started';
  };

  // Uppdatera useEffect för att sätta aktivt projekt
  useEffect(() => {
    const currentProject = projects.find((p) => p.id === activeProject);
    if (currentProject) {
      setProject(currentProject);
    }
  }, [activeProject, projects]);

  // Funktion för att lägga till ett nytt projekt
  const handleAddProject = () => {
    const newId = `proj-${Date.now()}`
    const projectToAdd: Project = {
      id: newId,
      name: "Nytt projekt",
      startDate: format(new Date(), "yyyy-MM-dd"),
      endDate: format(addMonths(new Date(), 3), "yyyy-MM-dd"),
      tasks: [],
      milestones: [],
      resources: [...sampleProject.resources], // Kopiera standardresurser
      color: "#0891b2",
      description: "",
    }

    setProjects((prev) => [...prev, projectToAdd])
    setIsAddingProject(false)
  }

  // Funktion för att navigera till ett projekt
  const navigateToProject = (projectId: string) => {
    const projectToView = projects.find((p) => p.id === projectId)
    if (projectToView) {
      setActiveProject(projectId)
      setCurrentView("project")
    }
  }

  // Funktion för att navigera tillbaka till projektvyn
  const navigateToProjects = () => {
    setCurrentView("projects")
  }

  // Funktion för att navigera till en fas
  const navigateToPhase = (phaseId: string) => {
    if (!project) return;
    
    const phase = project.tasks.find((t) => t.id === phaseId);
    if (phase) {
      setCurrentView("phase");
      setCurrentPhase(phaseId);
    }
  };

  // Extend view to 12 months if needed
  useEffect(() => {
    if (!project) return;
    
    const projectStart = parseISO(project.startDate)
    const projectEnd = parseISO(project.endDate)

    // Ensure we have at least 12 months of view
    const twelveMonthsFromStart = addMonths(projectStart, 12)
    if (isBefore(projectEnd, twelveMonthsFromStart)) {
      setViewEndDate(twelveMonthsFromStart)
    } else {
      setViewEndDate(projectEnd)
    }
  }, [project])

  // Adjust day width based on time scale
  useEffect(() => {
    switch (timeScale) {
      case "day":
        setDayWidth(40)
        break
      case "week":
        setDayWidth(20)
        break
      case "month":
        setDayWidth(8)
        break
      case "quarter":
        setDayWidth(4)
        break
      case "year":
        setDayWidth(2)
        break
    }
  }, [timeScale])

  // Generate dates for the timeline based on time scale
  const getTimelineItems = useMemo(() => {
    const items: { date: Date; type: "primary" | "secondary" }[] = []

    switch (timeScale) {
      case "day":
        // Primary: days, Secondary: none
        eachDayOfInterval({ start: viewStartDate, end: viewEndDate }).forEach((date) => {
          items.push({ date, type: "primary" })
        })
        break
      case "week":
        // Primary: weeks, Secondary: days
        eachWeekOfInterval({ start: viewStartDate, end: viewEndDate }, { locale: sv }).forEach((weekStart) => {
          items.push({ date: weekStart, type: "primary" })
          eachDayOfInterval({
            start: weekStart,
            end: addDays(weekStart, 6),
          }).forEach((day) => {
            if (!isSameDay(day, weekStart)) {
              items.push({ date: day, type: "secondary" })
            }
          })
        })
        break
      case "month":
        // Primary: months, Secondary: weeks
        eachMonthOfInterval({ start: viewStartDate, end: viewEndDate }).forEach((monthStart) => {
          items.push({ date: monthStart, type: "primary" })
          eachWeekOfInterval(
            {
              start: monthStart,
              end: endOfMonth(monthStart),
            },
            { locale: sv },
          ).forEach((weekStart) => {
            if (!isSameDay(weekStart, monthStart)) {
              items.push({ date: weekStart, type: "secondary" })
            }
          })
        })
        break
      case "quarter":
      case "year":
        // Primary: months only
        eachMonthOfInterval({ start: viewStartDate, end: viewEndDate }).forEach((date) => {
          items.push({ date, type: "primary" })
        })
        break
    }

    return items
  }, [timeScale, viewStartDate, viewEndDate])

  // Get all dates for the timeline
  const getDates = useCallback(() => {
    const dates: Date[] = []
    let currentDate = viewStartDate

    while (!isAfter(currentDate, viewEndDate)) {
      dates.push(currentDate)
      currentDate = addDays(currentDate, 1)
    }

    return dates
  }, [viewStartDate, viewEndDate])

  // Gruppera uppgifter per deras överordnade uppgift
  const groupedTasks = useMemo(() => {
    const result: Record<string, Task[]> = {}
    
    if (!project || !project.tasks) {
      return result;
    }
    
    project.tasks.forEach((task) => {
      if (task.parentId) {
        if (!result[task.parentId]) {
          result[task.parentId] = []
        }
        result[task.parentId].push(task)
      }
    })
    
    return result
  }, [project?.tasks])

  // Lägg till dessa nya funktioner i GanttChart-komponenten

  // Funktion för att öppna redigeringsdialogrutan för en uppgift
  const openTaskEditor = (taskId: string) => {
    setEditingTask(project?.tasks.find((t) => t.id === taskId) || null)
    setIsTaskModalOpen(true)
  }

  // Funktion för att spara ändringar i en uppgift
  const saveTaskChanges = (updatedTask: Task) => {
    if (!project) return;
    
    setProject((prev) => {
      if (!prev) return prev;
      
      return {
      ...prev,
      tasks: prev.tasks.map((task) => (task.id === updatedTask.id ? updatedTask : task)),
      }
    })
    setIsTaskModalOpen(false)
  }

  // Funktion för att lägga till en ny uppgift i en fas
  const addTaskToPhase = (phaseId: string) => {
    if (!project) return;
    
    // Hitta fasen
    const phase = project.tasks.find((t) => t.id === phaseId && t.isPhase);
    if (!phase) return;

    const newTask: Task = {
      id: `task-${Date.now()}`,
      name: "",
      description: "",
      startDate: phase.startDate,
      endDate: addDays(parseISO(phase.startDate), 3).toISOString(),
      progress: 0,
      status: "not-started",
      priority: "medium",
      resources: [],
      dependencies: [],
      parentId: phaseId,
      color: phase.color,
    };

    setEditingTask(newTask);
    setIsTaskModalOpen(true);
  }

  // Funktion för att lägga till en ny fas i projektet
  const addNewPhase = () => {
    if (!project) return;
    
    const newPhaseId = `phase-${Date.now()}`

    // Skapa ny fas
    const newPhase: Task = {
      id: newPhaseId,
      name: "Ny fas",
      description: "",
      startDate: project.startDate,
      endDate: project.endDate,
      progress: 0,
      status: "not-started",
      priority: "medium",
      resources: [],
      dependencies: [],
      color: "#6b7280",
      isPhase: true,
      subTasks: [],
    }

    // Uppdatera projektet
    setProjects((prev) =>
      prev.map((p) => {
        if (p.id === activeProject) {
          return {
            ...p,
            tasks: [...p.tasks, newPhase],
          }
        }
        return p
      }),
    )

    // Öppna redigeringsdialogrutan för den nya fasen
    openTaskEditor(newPhaseId)
  }

  // Funktion för att beräkna framsteg för en fas baserat på dess underuppgifter
  const calculatePhaseProgress = (phaseId: string) => {
    if (!project) return 0;
    
    const phase = project.tasks.find((t) => t.id === phaseId)
    if (!phase || !phase.subTasks || phase.subTasks.length === 0) return 0

    const subTasks = project.tasks.filter((t) => phase.subTasks?.includes(t.id))
    if (subTasks.length === 0) return 0

    const totalProgress = subTasks.reduce((sum, task) => sum + task.progress, 0)
    return Math.round(totalProgress / subTasks.length)
  }

  // Funktion för att uppdatera framsteg för alla faser
  const updateAllPhaseProgress = () => {
    setProjects((prev) =>
      prev.map((p) => {
        if (p.id === activeProject) {
          return {
            ...p,
            tasks: p.tasks.map((task) => {
              if (task.isPhase) {
                const progress = calculatePhaseProgress(task.id)
                return { ...task, progress }
              }
              return task
            }),
          }
        }
        return p
      }),
    )
  }

  // Hanterarfunktioner för UI-interaktioner
  const handleTimeScaleChange = (scale: TimeScale) => {
    setTimeScale(scale)
  }

  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode)
  }

  const handleZoomIn = () => {
    setDayWidth((prev) => prev + 5)
  }

  const handleZoomOut = () => {
    setDayWidth((prev) => Math.max(5, prev - 5))
  }

  const handleTimelineNavigate = (direction: "left" | "right") => {
    const timelineWidth = timelineRef.current?.offsetWidth || 0
    const ganttWidth = ganttRef.current?.offsetWidth || 0
    const visibleDays = timelineWidth / dayWidth

    if (direction === "left") {
      setViewStartDate((prev) => addDays(prev, -visibleDays / 2))
      setViewEndDate((prev) => addDays(prev, -visibleDays / 2))
    } else {
      setViewStartDate((prev) => addDays(prev, visibleDays / 2))
      setViewEndDate((prev) => addDays(prev, visibleDays / 2))
    }
  }

  const handleGoToToday = () => {
    const today = new Date()
    setViewStartDate(today)
    setViewEndDate(addMonths(today, 6))
  }

  const handleTaskDragStart = (taskId: string, e: React.DragEvent<HTMLDivElement>) => {
    setDraggingTask(taskId)
    e.dataTransfer.setData("taskId", taskId)
  }

  const handleTaskDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
  }

  const handleTaskDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    const taskId = e.dataTransfer.getData("taskId")
    setDraggingTask(null)

    // Implement task reordering logic here
    console.log(`Task ${taskId} dropped`)
  }

  const handleTaskResizeStart = (taskId: string, edge: "start" | "end", e: React.MouseEvent<HTMLDivElement>) => {
    if (!project) return;
    
    setResizingTask({ id: taskId, edge })
    e.stopPropagation()

    const handleMouseMove = (e: MouseEvent) => {
      const task = project.tasks.find((t) => t.id === taskId)
      if (!task) return

      const originalStartDate = parseISO(task.startDate)
      const originalEndDate = parseISO(task.endDate)

      if (resizingTask?.edge === "start") {
        const daysChange = Math.round(e.movementX / dayWidth)
        const newStartDate = addDays(originalStartDate, daysChange)

        if (isBefore(newStartDate, parseISO(project.startDate))) return

        setProjects((prev) =>
          prev.map((p) => {
            if (p.id === activeProject) {
              return {
                ...p,
                tasks: p.tasks.map((t) =>
                  t.id === taskId ? { ...t, startDate: format(newStartDate, "yyyy-MM-dd") } : t,
                ),
              }
            }
            return p
          }),
        )
      } else if (resizingTask?.edge === "end") {
        const daysChange = Math.round(e.movementX / dayWidth)
        const newEndDate = addDays(originalEndDate, daysChange)

        if (isAfter(newEndDate, parseISO(project.endDate))) return

        setProjects((prev) =>
          prev.map((p) => {
            if (p.id === activeProject) {
              return {
                ...p,
                tasks: p.tasks.map((t) => (t.id === taskId ? { ...t, endDate: format(newEndDate, "yyyy-MM-dd") } : t)),
              }
            }
            return p
          }),
        )
      }
    }

    const handleMouseUp = () => {
      setResizingTask(null)
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
    }

    document.addEventListener("mousemove", handleMouseMove)
    document.addEventListener("mouseup", handleMouseUp)
  }

  const handleTaskClick = (taskId: string, e: React.MouseEvent<HTMLDivElement>) => {
    if (isMultiSelecting) {
      setSelectedTasks((prev) => {
        const newSet = new Set(prev)
        if (newSet.has(taskId)) {
          newSet.delete(taskId)
        } else {
          newSet.add(taskId)
        }
        return newSet
      })
    } else {
      setSelectedTask(taskId)
    }
  }

  const handleTaskContextMenu = (taskId: string, e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault()
    setContextMenuPosition({ x: e.clientX, y: e.clientY })
    setContextMenuTaskId(taskId)
  }

  const handleStartInlineEdit = (taskId: string) => {
    setEditingTask(project?.tasks.find((t) => t.id === taskId) || null)
  }

  const handleSaveInlineEdit = (taskId: string, field: string, value: any) => {
    setProjects((prev) =>
      prev.map((p) => {
        if (p.id === activeProject) {
          return {
            ...p,
            tasks: p.tasks.map((task) => (task.id === taskId ? { ...task, [field]: value } : task)),
          }
        }
        return p
      }),
    )
  }

  const handleFinishInlineEdit = () => {
    setEditingTask(null)
  }

  const handleSaveInlineEditValue = (taskId: string, field: string, value: any) => {
    setProjects((prev) =>
      prev.map((p) => {
        if (p.id === activeProject) {
          return {
            ...p,
            tasks: p.tasks.map((task) => (task.id === taskId ? { ...task, [field]: value } : task)),
          }
        }
        return p
      }),
    )
  }

  const getTaskPosition = (task: Task) => {
    const left = getTaskLeft(task, dayWidth, viewStartDate)
    const width = getTaskWidth(task, dayWidth, viewStartDate)
    return { left, width }
  }

  // Filtrera uppgifter baserat på valda filter och sökfrågam
  const filteredTasks = useMemo(() => {
    if (!project || !project.tasks) {
      return [];
    }
    
    // Om vi har sökning, filtrera baserat på det
    if (searchTerm) {
      return project.tasks.filter((task) =>
        task.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Om inget sökord, returnera alla uppgifter
    return project.tasks;
  }, [project?.tasks, searchTerm]);

  // Beräkna projektframsteg baserat på faser
  const calculateProjectProgress = (projectId: string) => {
    const projectToCalculate = projects.find((p) => p.id === projectId)
    if (!projectToCalculate) return 0

    const phases = projectToCalculate.tasks.filter((t) => t.isPhase)
    if (phases.length === 0) return 0

    const totalProgress = phases.reduce((sum, phase) => sum + phase.progress, 0)
    return Math.round(totalProgress / phases.length)
  }

  // Uppdatera alla projekts framsteg
  const updateAllProjectsProgress = () => {
    setProjects((prev) =>
      prev.map((p) => ({
        ...p,
        progress: calculateProjectProgress(p.id),
      })),
    )
  }

  // Uppdatera useEffect för att uppdatera projektens framsteg när komponenten renderas
  useEffect(() => {
    updateAllProjectsProgress()
  }, [])

  // Uppdatera useEffect för att uppdatera fasernas framsteg när komponenten renderas
  useEffect(() => {
    updateAllPhaseProgress()
  }, [])

  // Uppdatera handleAddTask för att lägga till uppgift i rätt projekt
  const handleAddTask = () => {
    const newId = `task-${Date.now()}`

    setProjects((prev) =>
      prev.map((p) => {
        if (p.id === activeProject) {
          return {
            ...p,
            tasks: [...p.tasks, { id: newId, ...newTask } as Task],
          }
        }
        return p
      }),
    )

    setIsAddingTask(false)
    setNewTask({
      name: "",
      startDate: format(new Date(), "yyyy-MM-dd"),
      endDate: format(addDays(new Date(), 7), "yyyy-MM-dd"),
      progress: 0,
      status: "not-started",
      priority: "medium",
      resources: [],
      dependencies: [],
    })
  }

  // Funktion för att visa/dölja projekt
  const toggleProject = (projectId: string) => {
    setExpandedProjects((prev) => ({ 
      ...prev, 
      [projectId]: !prev[projectId] 
    }));
  };
  
  // Navigeringsfunktioner för månader
  const goToPreviousMonth = () => {
    if (viewStartDate) {
      const prevMonth = subMonths(viewStartDate, 1);
      setViewStartDate(prevMonth);
      setViewEndDate(addMonths(prevMonth, 1));
    }
  };
  
  const goToNextMonth = () => {
    if (viewStartDate) {
      const nextMonth = addMonths(viewStartDate, 1);
      setViewStartDate(nextMonth);
      setViewEndDate(addMonths(nextMonth, 1));
    }
  };

  // Om vi inte har något projekt eller om det laddar, visa laddningsindikator
  if (loading) {
    return (
      <div className="flex items-center justify-center h-[500px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        <span className="ml-2 text-muted-foreground">Laddar Gantt-schema...</span>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[500px]">
        <div className="text-destructive mb-4">{error}</div>
        <Button onClick={() => {
          // Försök använda exempeldata om API-anrop misslyckas
          setProjects(sampleProjects);
          setActiveProject(sampleProjects[0].id);
          setProject(sampleProjects[0]);
          setError(null);
        }}>Använd exempeldata</Button>
      </div>
    );
  }
  
  // Om vi fortfarande inte har något projekt, använd exempeldata
  if (!project) {
    console.log("Inget projekt tillgängligt, använder exempeldata istället");
    
    // Använd direkt exempel istället för att bara visa en knapp
    return (
      <div className="flex flex-col h-full">
        <div className="mb-4">
          <h1 className="text-2xl font-bold">Exempeldata Gantt-schema</h1>
          <p className="text-muted-foreground">Visar exempeldata eftersom inga projekt hittades</p>
        </div>

        <Card>
          <CardContent className="p-6 border rounded-md">
            <div className="flex flex-col space-y-4">
              {sampleProjects.map((proj) => (
                <div key={proj.id} className="border p-4 rounded-md">
                  <h2 className="text-xl font-semibold">{proj.name}</h2>
                  <p>{proj.description}</p>
                  <div className="mt-2">
                    <div className="font-medium">Faser:</div>
                    <ul className="list-disc pl-5 mt-1">
                      {proj.tasks.filter(t => t.isPhase).map((phase) => (
                        <li key={phase.id}>
                          {phase.name} - {phase.progress}% färdig
                          <div className="w-full bg-muted rounded-full h-2 mt-1">
                            <div 
                              className="bg-primary h-2 rounded-full" 
                              style={{ width: `${phase.progress}%`, backgroundColor: phase.color }}
                            ></div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Åtgärda HTML-hydration-felet
  return (
    <div className="flex flex-col h-full">
      {/* Åtgärdat hydration-fel här: */}
      <div className="flex items-center gap-2 mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            {breadcrumbs.map((item, index) => (
              <React.Fragment key={item.id}>
                {index > 0 && <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                {index === breadcrumbs.length - 1 ? (
                  <span className="font-medium">{item.name}</span>
                ) : (
                  <Button
                    variant="link"
                    className="p-0 h-auto"
                    onClick={() => {
                      if (item.type === "projects") {
                        navigateToProjects();
                      } else if (item.type === "project") {
                        navigateToProject(item.id);
                      } else if (item.type === "phase") {
                        const phaseProject = projects.find((p) =>
                          p.tasks.some((t) => t.id === item.id)
                        );
                        if (phaseProject) {
                          navigateToProject(phaseProject.id);
                          navigateToPhase(item.id);
                        }
                      }
                    }}
                  >
                    {item.name}
                  </Button>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
        
        {/* Visa lite knappar och kontroller för Gantt-schemat */}
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
      </div>
      
      {/* Visa grundläggande Gantt-diagram */}
      <div className="border rounded-md bg-white">
        {/* Lägg till kalender/tidslinje */}
        <div className="border-b sticky top-0 bg-white z-10">
          <div className="grid grid-cols-[200px_1fr] divide-x">
            <div className="p-2 font-medium text-sm">Projekt/faser</div>
            <div className="overflow-x-auto min-w-0">
              <div className="grid" style={{ gridTemplateColumns: `repeat(${daysInMonth}, minmax(30px, 1fr))` }}>
                {eachDayOfInterval({
                  start: startOfMonth(currentMonth),
                  end: endOfMonth(currentMonth)
                }).map((day, i) => {
                  const dayIsWeekend = isWeekend(day);
                  const dayIsToday = isToday(day);
                  return (
                    <div 
                      key={i} 
                      className={cn(
                        "px-1 py-2 text-center text-xs select-none border-r last:border-r-0",
                        dayIsWeekend ? "bg-muted/30" : "",
                        dayIsToday ? "bg-primary/10 font-bold" : ""
                      )}
                    >
                      <div className="font-medium">{format(day, 'd', { locale: sv })}</div>
                      <div className="text-muted-foreground text-[10px]">{format(day, 'EEE', { locale: sv })}</div>
                    </div>
                  );
                })}
              </div>
              <div className="h-6 border-t flex">
                {Array.from({ length: getWeeksInMonth(currentMonth) }).map((_, weekIndex) => (
                  <div 
                    key={weekIndex}
                    className="flex-1 text-center text-xs text-muted-foreground py-1 border-r last:border-r-0"
                  >
                    V. {format(addWeeks(startOfMonth(currentMonth), weekIndex), 'w', { locale: sv })}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Projekt och fas rader */}
        <div className="max-h-[500px] overflow-y-auto">
          {projects.length > 0 ? (
            <div className="grid grid-cols-[200px_1fr] divide-x">
              {/* Projektnamn kolumn */}
              <div className="divide-y">
                {projects.map((project) => {
                  const isExpanded = expandedProjects[project.id] || false;
                  
                  return (
                    <React.Fragment key={project.id}>
                      <div 
                        className="hover:bg-muted/20 transition-colors cursor-pointer p-2 flex items-center"
                        onClick={() => toggleProject(project.id)}
                      >
                        <span className="mr-1">{isExpanded ? '▼' : '▶'}</span>
                        <div className="font-medium">{project.name}</div>
                      </div>
                      
                      {isExpanded && project.tasks && project.tasks.map((phase) => (
                        <div 
                          key={phase.id}
                          className="bg-muted/5 hover:bg-muted/20 transition-colors p-2 pl-6"
                        >
                          <div className="font-medium">{phase.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {phase.progress || 0}% färdig
                          </div>
                        </div>
                      ))}
                    </React.Fragment>
                  );
                })}
              </div>
              
              {/* Gantt-staplar kolumn */}
              <div className="overflow-x-auto min-w-0">
                <div className="relative" style={{ 
                  height: calculateTotalRowsHeight(),
                  width: `calc(${daysInMonth} * 30px)`
                }}>
                  {projects.map((project, projectIndex) => {
                    const isExpanded = expandedProjects[project.id] || false;
                    const projectStart = parseISO(project.startDate);
                    const projectEnd = parseISO(project.endDate);
                    
                    // Räkna ut projektets position på tidslinjen
                    const monthStart = startOfMonth(currentMonth);
                    const dayWidth = 30; // px
                    
                    return (
                      <React.Fragment key={project.id}>
                        {/* Projektets stapel */}
                        <div 
                          className="absolute h-8 rounded-sm bg-primary/20 border border-primary/40"
                          style={{
                            top: `${projectIndex * 40}px`,
                            left: `${differenceInDays(projectStart, monthStart) * dayWidth}px`,
                            width: `${(differenceInDays(projectEnd, projectStart) + 1) * dayWidth}px`,
                            display: isExpanded ? 'none' : 'block'
                          }}
                        />
                        
                        {/* Faser om projektet är expanderat */}
                        {isExpanded && project.tasks && project.tasks.map((phase, phaseIndex) => {
                          const phaseStart = parseISO(phase.startDate);
                          const phaseEnd = parseISO(phase.endDate);
                          
                          return (
                            <div 
                              key={phase.id}
                              className="absolute h-6 rounded-sm"
                              style={{
                                top: `${projectIndex * 40 + (phaseIndex + 1) * 40}px`,
                                left: `${differenceInDays(phaseStart, monthStart) * dayWidth}px`,
                                width: `${(differenceInDays(phaseEnd, phaseStart) + 1) * dayWidth}px`,
                                backgroundColor: phase.color || '#0891b2',
                                opacity: 0.8
                              }}
                            >
                              {/* Progress bar */}
                              <div 
                                className="absolute top-0 left-0 h-full bg-black/10"
                                style={{ width: `${phase.progress || 0}%` }}
                              />
                            </div>
                          );
                        })}
                      </React.Fragment>
                    );
                  })}
                  
                  {/* Vertikala linjer för varje dag */}
                  {eachDayOfInterval({
                    start: startOfMonth(currentMonth),
                    end: endOfMonth(currentMonth)
                  }).map((day, i) => {
                    const dayIsWeekend = isWeekend(day);
                    const dayIsToday = isToday(day);
                    
                    return (
                      <div 
                        key={i}
                        className={cn(
                          "absolute top-0 h-full border-r",
                          dayIsWeekend ? "bg-muted/30" : "",
                          dayIsToday ? "bg-primary/10 border-primary/30 border-r-2" : ""
                        )}
                        style={{
                          left: `${i * 30}px`,
                          width: '30px'
                        }}
                      />
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex p-4">
              <span className="text-muted-foreground">Inga projekt</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


