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
export default function GanttChart() {
  const [projects, setProjects] = useState<Project[]>(sampleProjects)
  const [activeProject, setActiveProject] = useState<string>(sampleProject.id)
  const [project, setProject] = useState<Project>(sampleProject)
  const [viewStartDate, setViewStartDate] = useState<Date>(parseISO(project.startDate))
  const [viewEndDate, setViewEndDate] = useState<Date>(parseISO(project.endDate))
  const [dayWidth, setDayWidth] = useState<number>(40)
  const [draggingTask, setDraggingTask] = useState<string | null>(null)
  const [resizingTask, setResizingTask] = useState<{ id: string; edge: "start" | "end" } | null>(null)
  const [searchTerm, setSearchTerm] = useState<string>("")
  const [showResources, setShowResources] = useState<boolean>(true)
  const [showDependencies, setShowDependencies] = useState<boolean>(true)
  const [showMilestones, setShowMilestones] = useState<boolean>(true)
  const [selectedTask, setSelectedTask] = useState<string | null>(null)
  const [isAddingTask, setIsAddingTask] = useState<boolean>(false)
  const [isAddingProject, setIsAddingProject] = useState<boolean>(false)
  const [editingTask, setEditingTask] = useState<string | null>(null)
  const [timeScale, setTimeScale] = useState<TimeScale>("day")
  const [viewMode, setViewMode] = useState<ViewMode>("standard")
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set())
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set())
  const [isMultiSelecting, setIsMultiSelecting] = useState<boolean>(false)
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
  const [newProject, setNewProject] = useState<Partial<Project>>({
    name: "Nytt projekt",
    startDate: format(new Date(), "yyyy-MM-dd"),
    endDate: format(addMonths(new Date(), 3), "yyyy-MM-dd"),
    tasks: [],
    milestones: [],
    resources: [],
    color: "#0891b2",
  })

  // Lägg till dessa nya state-variabler i GanttChart-komponenten
  const [currentView, setCurrentView] = useState<"projects" | "project" | "phase">("projects")
  const [currentPhase, setCurrentPhase] = useState<string | null>(null)
  const [isEditingTask, setIsEditingTask] = useState<boolean>(false)
  const [taskToEdit, setTaskToEdit] = useState<string | null>(null)
  const [breadcrumbs, setBreadcrumbs] = useState<
    { id: string; name: string; type: "projects" | "project" | "phase" }[]
  >([{ id: "projects", name: "Alla projekt", type: "projects" }])

  const ganttRef = useRef<HTMLDivElement>(null)
  const taskListRef = useRef<HTMLDivElement>(null)
  const timelineRef = useRef<HTMLDivElement>(null)
  const timelineHeaderRef = useRef<HTMLDivElement>(null)
  const timelineContentRef = useRef<HTMLDivElement>(null)

  // Uppdatera useEffect för att sätta aktivt projekt
  useEffect(() => {
    const currentProject = projects.find((p) => p.id === activeProject)
    if (currentProject) {
      setProject(currentProject)
    }
  }, [activeProject, projects])

  // Funktion för att lägga till ett nytt projekt
  const handleAddProject = () => {
    const newId = `proj-${Date.now()}`
    const projectToAdd: Project = {
      id: newId,
      name: newProject.name || "Nytt projekt",
      startDate: newProject.startDate || format(new Date(), "yyyy-MM-dd"),
      endDate: newProject.endDate || format(addMonths(new Date(), 3), "yyyy-MM-dd"),
      tasks: [],
      milestones: [],
      resources: [...sampleProject.resources], // Kopiera standardresurser
      color: newProject.color || "#0891b2",
      description: newProject.description || "",
    }

    setProjects((prev) => [...prev, projectToAdd])
    setIsAddingProject(false)
    setNewProject({
      name: "Nytt projekt",
      startDate: format(new Date(), "yyyy-MM-dd"),
      endDate: format(addMonths(new Date(), 3), "yyyy-MM-dd"),
      tasks: [],
      milestones: [],
      resources: [],
      color: "#0891b2",
    })
  }

  // Funktion för att navigera till ett projekt
  const navigateToProject = (projectId: string) => {
    const projectToView = projects.find((p) => p.id === projectId)
    if (projectToView) {
      setActiveProject(projectId)
      setCurrentView("project")
      setBreadcrumbs([
        { id: "projects", name: "Alla projekt", type: "projects" },
        { id: projectId, name: projectToView.name, type: "project" },
      ])
    }
  }

  // Funktion för att navigera tillbaka till projektvyn
  const navigateToProjects = () => {
    setCurrentView("projects")
    setBreadcrumbs([{ id: "projects", name: "Alla projekt", type: "projects" }])
  }

  // Funktion för att navigera till en fas
  const navigateToPhase = (phaseId: string) => {
    const phase = project.tasks.find((t) => t.id === phaseId)
    if (phase) {
      setCurrentPhase(phaseId)
      setCurrentView("phase")
      setBreadcrumbs([
        { id: "projects", name: "Alla projekt", type: "projects" },
        { id: project.id, name: project.name, type: "project" },
        { id: phaseId, name: phase.name, type: "phase" },
      ])
    }
  }

  // Extend view to 12 months if needed
  useEffect(() => {
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

  // Group tasks by parent
  const groupedTasks = useMemo(() => {
    const result: { [key: string]: Task[] } = {
      root: [],
    }

    project.tasks.forEach((task) => {
      if (task.parentId) {
        if (!result[task.parentId]) {
          result[task.parentId] = []
        }
        result[task.parentId].push(task)
      } else {
        result.root.push(task)
      }
    })

    return result
  }, [project.tasks])

  // Lägg till dessa nya funktioner i GanttChart-komponenten

  // Funktion för att öppna redigeringsdialogrutan för en uppgift
  const openTaskEditor = (taskId: string) => {
    setTaskToEdit(taskId)
    setIsEditingTask(true)
  }

  // Funktion för att spara ändringar i en uppgift
  const saveTaskChanges = (updatedTask: Task) => {
    setProject((prev) => ({
      ...prev,
      tasks: prev.tasks.map((task) => (task.id === updatedTask.id ? updatedTask : task)),
    }))
    setIsEditingTask(false)
    setTaskToEdit(null)
  }

  // Funktion för att lägga till en ny uppgift i en fas
  const addTaskToPhase = (phaseId: string) => {
    const phase = project.tasks.find((t) => t.id === phaseId)
    if (!phase) return

    const newTaskId = `task-${Date.now()}`

    // Skapa ny uppgift
    const newTask: Task = {
      id: newTaskId,
      name: "Ny uppgift",
      description: "",
      startDate: phase.startDate,
      endDate: phase.endDate,
      progress: 0,
      status: "not-started",
      priority: "medium",
      resources: [],
      dependencies: [],
      parentId: phaseId,
      color: phase.color,
    }

    // Uppdatera fasen med den nya uppgiften
    const updatedPhase: Task = {
      ...phase,
      subTasks: [...(phase.subTasks || []), newTaskId],
    }

    // Uppdatera projektet
    setProjects((prev) =>
      prev.map((p) => {
        if (p.id === activeProject) {
          return {
            ...p,
            tasks: [...p.tasks.filter((t) => t.id !== phaseId), updatedPhase, newTask],
          }
        }
        return p
      }),
    )

    // Öppna redigeringsdialogrutan för den nya uppgiften
    openTaskEditor(newTaskId)
  }

  // Funktion för att lägga till en ny fas i projektet
  const addNewPhase = () => {
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
    setEditingTask(taskId)
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

  // Hämta alla datum för tidslinjen
  const dates = getDates()

  // Uppdatera filteredTasks för att visa rätt uppgifter baserat på aktuell vy
  const filteredTasks = useMemo(() => {
    // Filtrera först baserat på sökterm
    const searchFiltered = project.tasks.filter(
      (task) =>
        task.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (task.description && task.description.toLowerCase().includes(searchTerm.toLowerCase())),
    )

    if (searchTerm) {
      return searchFiltered
    }

    // Om vi är i projektöversikten, visa alla projekt
    if (currentView === "projects") {
      return []
    }

    // Om vi är i projektvy, visa bara faser
    if (currentView === "project") {
      return project.tasks.filter((task) => task.isPhase)
    }

    // Om vi är i fasvy, visa bara uppgifter i den aktuella fasen
    if (currentView === "phase" && currentPhase) {
      return project.tasks.filter((task) => task.parentId === currentPhase)
    }

    return []
  }, [project.tasks, searchTerm, currentView, currentPhase, project.id])

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

  // Lägg till denna JSX-kod för att visa brödsmulor i övre delen av Gantt-schemat
  // Lägg till detta direkt efter <div className="p-4 border-b flex items-center justify-between flex-wrap gap-2">
  return (
    <Card className="w-full">
      <CardContent className="p-0">
        <div className="p-4 border-b flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold">{currentView === "projects" ? "Projektöversikt" : project.name}</h2>
            {currentView !== "projects" && (
              <Badge variant="outline" className="ml-2">
                {format(parseISO(project.startDate), "d MMM yyyy", { locale: sv })} -
                {format(parseISO(project.endDate), "d MMM yyyy", { locale: sv })}
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Sök uppgifter..."
                className="w-[200px] pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  <Calendar className="mr-2 h-4 w-4" />
                  {timeScale === "day" && "Dag"}
                  {timeScale === "week" && "Vecka"}
                  {timeScale === "month" && "Månad"}
                  {timeScale === "quarter" && "Kvartal"}
                  {timeScale === "year" && "År"}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleTimeScaleChange("day")}>Dag</DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleTimeScaleChange("week")}>Vecka</DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleTimeScaleChange("month")}>Månad</DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleTimeScaleChange("quarter")}>Kvartal</DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleTimeScaleChange("year")}>År</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  <Settings className="mr-2 h-4 w-4" />
                  Vy
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleViewModeChange("standard")}>Standard</DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleViewModeChange("compact")}>Kompakt</DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleViewModeChange("detailed")}>Detaljerad</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <Checkbox
                    id="show-resources"
                    checked={showResources}
                    onCheckedChange={(checked) => setShowResources(!!checked)}
                    className="mr-2"
                  />
                  <label htmlFor="show-resources">Visa resurser</label>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Checkbox
                    id="show-dependencies"
                    checked={showDependencies}
                    onCheckedChange={(checked) => setShowDependencies(!!checked)}
                    className="mr-2"
                  />
                  <label htmlFor="show-dependencies">Visa beroenden</label>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Checkbox
                    id="show-milestones"
                    checked={showMilestones}
                    onCheckedChange={(checked) => setShowMilestones(!!checked)}
                    className="mr-2"
                  />
                  <label htmlFor="show-milestones">Visa milstolpar</label>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="icon" onClick={handleZoomIn}>
                    <ZoomIn className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Zooma in</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="icon" onClick={handleZoomOut}>
                    <ZoomOut className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Zooma ut</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {currentView !== "projects" && (
              <Dialog open={isAddingTask} onOpenChange={setIsAddingTask}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Lägg till uppgift
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px]">
                  <DialogHeader>
                    <DialogTitle>Lägg till ny uppgift</DialogTitle>
                    <DialogDescription>Fyll i information om den nya uppgiften.</DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="name" className="text-right">
                        Namn
                      </Label>
                      <Input
                        id="name"
                        value={newTask.name || ""}
                        onChange={(e) => setNewTask({ ...newTask, name: e.target.value })}
                        className="col-span-3"
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="description" className="text-right">
                        Beskrivning
                      </Label>
                      <Input
                        id="description"
                        value={newTask.description || ""}
                        onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                        className="col-span-3"
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="startDate" className="text-right">
                        Startdatum
                      </Label>
                      <Input
                        id="startDate"
                        type="date"
                        value={newTask.startDate || ""}
                        onChange={(e) => setNewTask({ ...newTask, startDate: e.target.value })}
                        className="col-span-3"
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="endDate" className="text-right">
                        Slutdatum
                      </Label>
                      <Input
                        id="endDate"
                        type="date"
                        value={newTask.endDate || ""}
                        onChange={(e) => setNewTask({ ...newTask, endDate: e.target.value })}
                        className="col-span-3"
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="parentTask" className="text-right">
                        Föräldrauppgift
                      </Label>
                      <select
                        id="parentTask"
                        value={newTask.parentId || ""}
                        onChange={(e) => setNewTask({ ...newTask, parentId: e.target.value || undefined })}
                        className="col-span-3 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <option value="">Ingen (toppnivå)</option>
                        {project.tasks.map((task) => (
                          <option key={task.id} value={task.id}>
                            {task.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="status" className="text-right">
                        Status
                      </Label>
                      <select
                        id="status"
                        value={newTask.status || "not-started"}
                        onChange={(e) => setNewTask({ ...newTask, status: e.target.value as TaskStatus })}
                        className="col-span-3 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <option value="not-started">Ej påbörjad</option>
                        <option value="in-progress">Pågående</option>
                        <option value="completed">Slutförd</option>
                        <option value="delayed">Försenad</option>
                        <option value="cancelled">Avbruten</option>
                      </select>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="priority" className="text-right">
                        Prioritet
                      </Label>
                      <select
                        id="priority"
                        value={newTask.priority || "medium"}
                        onChange={(e) => setNewTask({ ...newTask, priority: e.target.value as TaskPriority })}
                        className="col-span-3 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <option value="low">Låg</option>
                        <option value="medium">Medium</option>
                        <option value="high">Hög</option>
                        <option value="critical">Kritisk</option>
                      </select>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="progress" className="text-right">
                        Framsteg ({newTask.progress || 0}%)
                      </Label>
                      <div className="col-span-3">
                        <Slider
                          id="progress"
                          defaultValue={[newTask.progress || 0]}
                          max={100}
                          step={5}
                          onValueChange={(value) => setNewTask({ ...newTask, progress: value[0] })}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="resources" className="text-right">
                        Resurser
                      </Label>
                      <div className="col-span-3">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="w-full justify-between">
                              <span>Välj resurser</span>
                              <ChevronDown className="h-4 w-4 opacity-50" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent className="w-56">
                            {project.resources.map((resource) => (
                              <DropdownMenuItem key={resource.id}>
                                <Checkbox
                                  id={`resource-${resource.id}`}
                                  checked={newTask.resources?.includes(resource.id)}
                                  onCheckedChange={(checked) => {
                                    if (checked) {
                                      setNewTask({
                                        ...newTask,
                                        resources: [...(newTask.resources || []), resource.id],
                                      })
                                    } else {
                                      setNewTask({
                                        ...newTask,
                                        resources: newTask.resources?.filter((id) => id !== resource.id) || [],
                                      })
                                    }
                                  }}
                                  className="mr-2"
                                />
                                <label htmlFor={`resource-${resource.id}`} className="flex items-center gap-2">
                                  <Avatar className="h-6 w-6">
                                    <AvatarImage src={resource.avatar} alt={resource.name} />
                                    <AvatarFallback style={{ backgroundColor: resource.color }}>
                                      {resource.name.substring(0, 2)}
                                    </AvatarFallback>
                                  </Avatar>
                                  {resource.name}
                                </label>
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="color" className="text-right">
                        Färg
                      </Label>
                      <Input
                        id="color"
                        type="color"
                        value={newTask.color || "#0891b2"}
                        onChange={(e) => setNewTask({ ...newTask, color: e.target.value })}
                        className="col-span-3 h-10 w-full"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setIsAddingTask(false)}>
                      Avbryt
                    </Button>
                    <Button type="button" onClick={handleAddTask}>
                      Lägg till
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}

            {currentView === "projects" && (
              <Dialog open={isAddingProject} onOpenChange={setIsAddingProject}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Lägg till projekt
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px]">
                  <DialogHeader>
                    <DialogTitle>Lägg till nytt projekt</DialogTitle>
                    <DialogDescription>Fyll i information om det nya projektet.</DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="project-name" className="text-right">
                        Namn
                      </Label>
                      <Input
                        id="project-name"
                        value={newProject.name || ""}
                        onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                        className="col-span-3"
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="project-description" className="text-right">
                        Beskrivning
                      </Label>
                      <Input
                        id="project-description"
                        value={newProject.description || ""}
                        onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                        className="col-span-3"
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="project-startDate" className="text-right">
                        Startdatum
                      </Label>
                      <Input
                        id="project-startDate"
                        type="date"
                        value={newProject.startDate || ""}
                        onChange={(e) => setNewProject({ ...newProject, startDate: e.target.value })}
                        className="col-span-3"
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="project-endDate" className="text-right">
                        Slutdatum
                      </Label>
                      <Input
                        id="project-endDate"
                        type="date"
                        value={newProject.endDate || ""}
                        onChange={(e) => setNewProject({ ...newProject, endDate: e.target.value })}
                        className="col-span-3"
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="project-color" className="text-right">
                        Färg
                      </Label>
                      <Input
                        id="project-color"
                        type="color"
                        value={newProject.color || "#0891b2"}
                        onChange={(e) => setNewProject({ ...newProject, color: e.target.value })}
                        className="col-span-3 h-10 w-full"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setIsAddingProject(false)}>
                      Avbryt
                    </Button>
                    <Button type="button" onClick={handleAddProject}>
                      Lägg till
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}

            <Button variant="outline">
              <Save className="mr-2 h-4 w-4" />
              Spara
            </Button>
          </div>
        </div>

        <div className="px-4 py-2 border-b flex items-center gap-2">
          {breadcrumbs.length > 0 && (
            <div className="flex items-center gap-2">
              {breadcrumbs.map((crumb, index) => (
                <React.Fragment key={crumb.id}>
                  {index > 0 && <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      if (crumb.type === "projects") {
                        navigateToProjects()
                      } else if (crumb.type === "project") {
                        navigateToProject(crumb.id)
                      } else if (crumb.type === "phase") {
                        navigateToPhase(crumb.id)
                      }
                    }}
                  >
                    {crumb.name}
                  </Button>
                </React.Fragment>
              ))}
            </div>
          )}
        </div>

        <div className="flex border-b">
          <div className="w-[300px] min-w-[300px] border-r">
            <div className="p-2 bg-muted flex items-center justify-between">
              <h3 className="font-medium">
                {currentView === "projects" ? "Projekt" : currentView === "project" ? "Faser" : "Uppgifter"}
              </h3>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => setIsMultiSelecting(!isMultiSelecting)}
                >
                  <Checkbox checked={isMultiSelecting} className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
          <div className="flex-1 overflow-hidden">
            <div className="p-2 bg-muted flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <h3 className="font-medium">Tidslinje</h3>
              </div>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={handleGoToToday}>
                  Idag
                </Button>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleTimelineNavigate("left")}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleTimelineNavigate("right")}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div ref={timelineHeaderRef} className="overflow-x-auto scrollbar-hide">
              {timeScale === "day" && (
                <div className="flex border-b">
                  {dates.map((date, index) => (
                    <div
                      key={index}
                      className={`flex-shrink-0 text-center border-r text-xs py-1 ${
                        date.getDay() === 0 || date.getDay() === 6 ? "bg-muted/50" : ""
                      }`}
                      style={{ width: `${dayWidth}px` }}
                    >
                      {format(date, "d", { locale: sv })}
                    </div>
                  ))}
                </div>
              )}

              {timeScale === "day" && (
                <div className="flex">
                  {dates.map((date, index) => (
                    <div
                      key={index}
                      className={`flex-shrink-0 text-center border-r text-xs py-1 ${
                        date.getDay() === 0 || date.getDay() === 6 ? "bg-muted/50" : ""
                      }`}
                      style={{ width: `${dayWidth}px` }}
                    >
                      {format(date, "EEE", { locale: sv })}
                    </div>
                  ))}
                </div>
              )}

              {timeScale === "week" && (
                <div className="flex border-b">
                  {eachWeekOfInterval({ start: viewStartDate, end: viewEndDate }, { locale: sv }).map((date, index) => (
                    <div
                      key={index}
                      className="flex-shrink-0 text-center border-r text-xs py-1"
                      style={{ width: `${dayWidth * 7}px` }}
                    >
                      Vecka {format(date, "w", { locale: sv })}
                    </div>
                  ))}
                </div>
              )}

              {timeScale === "month" && (
                <div className="flex border-b">
                  {eachMonthOfInterval({ start: viewStartDate, end: viewEndDate }).map((date, index) => (
                    <div
                      key={index}
                      className="flex-shrink-0 text-center border-r text-xs py-1"
                      style={{ width: `${dayWidth * 30}px` }}
                    >
                      {format(date, "MMMM yyyy", { locale: sv })}
                    </div>
                  ))}
                </div>
              )}

              {timeScale === "quarter" && (
                <div className="flex border-b">
                  {eachMonthOfInterval({ start: viewStartDate, end: viewEndDate })
                    .map((date, index) => {
                      if (index % 3 === 0) {
                        const quarter = Math.floor(getMonth(date) / 3) + 1
                        return (
                          <div
                            key={index}
                            className="flex-shrink-0 text-center border-r text-xs py-1"
                            style={{ width: `${dayWidth * 90}px` }}
                          >
                            Q{quarter} {getYear(date)}
                          </div>
                        )
                      }
                      return null
                    })
                    .filter(Boolean)}
                </div>
              )}

              {timeScale === "year" && (
                <div className="flex border-b">
                  {Array.from({ length: getYear(viewEndDate) - getYear(viewStartDate) + 1 }).map((_, index) => (
                    <div
                      key={index}
                      className="flex-shrink-0 text-center border-r text-xs py-1"
                      style={{ width: `${dayWidth * 365}px` }}
                    >
                      {getYear(viewStartDate) + index}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex h-[500px]">
          <div ref={taskListRef} className="w-[300px] min-w-[300px] border-r overflow-y-auto">
            {currentView === "projects"
              ? // Visa projektlistan
                projects.map((proj) => {
                  const progress = proj.progress || calculateProjectProgress(proj.id)
                  return (
                    <div
                      key={proj.id}
                      className="p-2 border-b hover:bg-muted/50 cursor-pointer font-medium"
                      onClick={() => navigateToProject(proj.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-5 w-5 p-0"
                            onClick={(e) => {
                              e.stopPropagation()
                              navigateToProject(proj.id)
                            }}
                          >
                            <ChevronRight className="h-3 w-3" />
                          </Button>
                          <div className="truncate">{proj.name}</div>
                        </div>
                      </div>

                      {proj.description && (
                        <div className="text-xs text-muted-foreground truncate">{proj.description}</div>
                      )}

                      <div className="flex items-center justify-between mt-1">
                        <div className="text-xs">
                          {format(parseISO(proj.startDate), "d MMM", { locale: sv })} -
                          {format(parseISO(proj.endDate), "d MMM", { locale: sv })}
                        </div>
                        <div className="text-xs">{progress}%</div>
                      </div>

                      <div className="w-full bg-muted rounded-full h-1.5 mt-1">
                        <div
                          className="bg-primary h-1.5 rounded-full"
                          style={{ width: `${progress}%`, backgroundColor: proj.color }}
                        ></div>
                      </div>
                    </div>
                  )
                })
              : // Visa faser eller uppgifter beroende på currentView
                filteredTasks.map((task) => {
                  const isPhase = task.isPhase
                  const hasChildren = isPhase && (task.subTasks?.length || 0) > 0
                  const isSelected = selectedTasks.has(task.id) || selectedTask === task.id
                  const isEditing = editingTask === task.id

                  return (
                    <div
                      key={task.id}
                      className={`p-2 border-b hover:bg-muted/50 cursor-pointer ${
                        isSelected ? "bg-muted" : ""
                      } ${isPhase ? "font-medium" : "pl-2"}`}
                      onClick={(e) => handleTaskClick(task.id, e)}
                      onContextMenu={(e) => handleTaskContextMenu(task.id, e)}
                      onDoubleClick={() => (isPhase ? navigateToPhase(task.id) : openTaskEditor(task.id))}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          {isPhase && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-5 w-5 p-0"
                              onClick={(e) => {
                                e.stopPropagation()
                                currentView === "project" ? navigateToPhase(task.id) : null
                              }}
                            >
                              <ChevronRight className="h-3 w-3" />
                            </Button>
                          )}

                          {isEditing ? (
                            <Input
                              value={task.name}
                              onChange={(e) => handleSaveInlineEdit(task.id, "name", e.target.value)}
                              onBlur={handleFinishInlineEdit}
                              autoFocus
                              className="h-6 py-0 text-sm"
                              onClick={(e) => e.stopPropagation()}
                            />
                          ) : (
                            <div className="truncate">{task.name}</div>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          <div className={`w-2 h-2 rounded-full ${getPriorityColor(task.priority)}`} />
                          <div className={`w-2 h-2 rounded-full ${getStatusColor(task.status)}`} />
                        </div>
                      </div>

                      {task.description && (
                        <div className="text-xs text-muted-foreground truncate">{task.description}</div>
                      )}

                      <div className="flex items-center justify-between mt-1">
                        <div className="text-xs">
                          {format(parseISO(task.startDate), "d MMM", { locale: sv })} -
                          {format(parseISO(task.endDate), "d MMM", { locale: sv })}
                        </div>
                        <div className="text-xs">{task.progress}%</div>
                      </div>

                      {showResources && task.resources.length > 0 && (
                        <div className="flex -space-x-2 mt-1">
                          {task.resources.map((resourceId) => {
                            const resource = project.resources.find((r) => r.id === resourceId)
                            if (!resource) return null
                            return (
                              <TooltipProvider key={resourceId}>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Avatar className="h-6 w-6 border-2 border-background">
                                      <AvatarImage src={resource.avatar} alt={resource.name} />
                                      <AvatarFallback style={{ backgroundColor: resource.color }}>
                                        {resource.name.substring(0, 2)}
                                      </AvatarFallback>
                                    </Avatar>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>
                                      {resource.name} - {resource.role}
                                    </p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )
                })}

            <div className="p-2 border-b">
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-center"
                onClick={() => {
                  if (currentView === "projects") {
                    setIsAddingProject(true)
                  } else if (currentView === "project") {
                    addNewPhase()
                  } else if (currentView === "phase" && currentPhase) {
                    addTaskToPhase(currentPhase)
                  }
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                {currentView === "projects"
                  ? "Lägg till nytt projekt"
                  : currentView === "project"
                    ? "Lägg till ny fas"
                    : "Lägg till ny uppgift"}
              </Button>
            </div>
          </div>

          <div
            ref={timelineRef}
            className="flex-1 relative overflow-x-auto overflow-y-auto"
            onDragOver={handleTaskDragOver}
            onDrop={handleTaskDrop}
          >
            <div
              ref={ganttRef}
              className="relative"
              style={{
                width:
                  timeScale === "day"
                    ? `${dates.length * dayWidth}px`
                    : timeScale === "week"
                      ? `${Math.ceil(dates.length / 7) * (7 * dayWidth)}px`
                      : timeScale === "month"
                        ? `${Math.ceil(dates.length / 30) * (30 * dayWidth)}px`
                        : timeScale === "quarter"
                          ? `${Math.ceil(dates.length / 90) * (90 * dayWidth)}px`
                          : `${Math.ceil(dates.length / 365) * (365 * dayWidth)}px`,
                minHeight: "100%",
              }}
            >
              {/* Grid lines */}
              {timeScale === "day" &&
                dates.map((date, index) => (
                  <div
                    key={index}
                    className={`absolute top-0 bottom-0 border-r ${
                      date.getDay() === 0 || date.getDay() === 6 ? "bg-muted/50" : ""
                    } ${isSameDay(date, new Date()) ? "bg-blue-50" : ""}`}
                    style={{
                      left: `${index * dayWidth}px`,
                      width: `${dayWidth}px`,
                    }}
                  />
                ))}

              {/* Andra gridlinjer för olika tidsskalor är oförändrade */}

              {/* Today line */}
              <div
                className="absolute top-0 bottom-0 border-l-2 border-primary z-10"
                style={{
                  left:
                    timeScale === "day"
                      ? `${differenceInDays(new Date(), viewStartDate) * dayWidth}px`
                      : timeScale === "week"
                        ? `${Math.floor(differenceInDays(new Date(), viewStartDate) / 7) * (7 * dayWidth)}px`
                        : timeScale === "month"
                          ? `${(getMonth(new Date()) - getMonth(viewStartDate) + (getYear(new Date()) - getYear(viewStartDate)) * 12) * (30 * dayWidth)}px`
                          : timeScale === "quarter"
                            ? `${(Math.floor(getMonth(new Date()) / 3) - Math.floor(getMonth(viewStartDate) / 3) + (getYear(new Date()) - getYear(viewStartDate)) * 4) * (90 * dayWidth)}px`
                            : `${(getYear(new Date()) - getYear(viewStartDate)) * (365 * dayWidth)}px`,
                }}
              />

              {/* Visa projekt i projektöversikten */}
              {currentView === "projects" &&
                projects.map((proj, index) => {
                  const startDate = parseISO(proj.startDate)
                  const endDate = parseISO(proj.endDate)
                  const left = differenceInDays(startDate, viewStartDate) * dayWidth
                  const width = (differenceInDays(endDate, startDate) + 1) * dayWidth
                  const progress = proj.progress || calculateProjectProgress(proj.id)

                  return (
                    <div
                      key={proj.id}
                      className="absolute rounded-md border"
                      style={{
                        left: `${left}px`,
                        top: `${index * (viewMode === "compact" ? 30 : 60) + 10}px`,
                        width: `${width}px`,
                        height: viewMode === "compact" ? "20px" : "40px",
                        backgroundColor: proj.color || "#0891b2",
                      }}
                      onClick={() => navigateToProject(proj.id)}
                    >
                      <div className="flex items-center justify-between h-full px-2 text-white">
                        <div className="truncate text-sm font-medium">{proj.name}</div>
                        {viewMode !== "compact" && <div className="text-xs whitespace-nowrap">{progress}%</div>}
                      </div>

                      {/* Progress bar */}
                      <div className="absolute left-0 top-0 bottom-0 bg-white/20" style={{ width: `${progress}%` }} />
                    </div>
                  )
                })}

              {/* Tasks */}
              {currentView !== "projects" &&
                filteredTasks.map((task, index) => {
                  const { left, width } = getTaskPosition(task)
                  const isSelected = selectedTasks.has(task.id) || selectedTask === task.id

                  return (
                    <div
                      key={task.id}
                      className={`absolute rounded-md border ${isSelected ? "ring-2 ring-primary" : ""}`}
                      style={{
                        left: `${left}px`,
                        top: `${index * (viewMode === "compact" ? 30 : 60) + 10}px`,
                        width: `${width}px`,
                        height: viewMode === "compact" ? "20px" : "40px",
                        backgroundColor: task.color || "#0891b2",
                        opacity: draggingTask === task.id ? 0.7 : 1,
                      }}
                      draggable
                      onDragStart={(e) => handleTaskDragStart(task.id, e)}
                      onClick={(e) => handleTaskClick(task.id, e)}
                      onContextMenu={(e) => handleTaskContextMenu(task.id, e)}
                    >
                      <div className="flex items-center justify-between h-full px-2 text-white">
                        <div className="truncate text-sm font-medium">{task.name}</div>
                        {viewMode !== "compact" && <div className="text-xs whitespace-nowrap">{task.progress}%</div>}
                      </div>

                      {/* Resize handles */}
                      <div
                        className="absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize"
                        onMouseDown={(e) => handleTaskResizeStart(task.id, "start", e)}
                      />
                      <div
                        className="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize"
                        onMouseDown={(e) => handleTaskResizeStart(task.id, "end", e)}
                      />

                      {/* Progress bar */}
                      <div
                        className="absolute left-0 top-0 bottom-0 bg-white/20"
                        style={{ width: `${task.progress}%` }}
                      />
                    </div>
                  )
                })}

              {/* Dependencies */}
              {showDependencies &&
                filteredTasks.flatMap((task) =>
                  task.dependencies.map((dep) => {
                    const fromTask = project.tasks.find((t) => t.id === dep.fromTaskId)
                    const toTask = project.tasks.find((t) => t.id === dep.toTaskId)

                    if (!fromTask || !toTask) return null

                    const fromTaskIndex = filteredTasks.findIndex((t) => t.id === fromTask.id)
                    const toTaskIndex = filteredTasks.findIndex((t) => t.id === toTask.id)

                    if (fromTaskIndex === -1 || toTaskIndex === -1) return null

                    const fromPosition = getTaskPosition(fromTask)
                    const toPosition = getTaskPosition(toTask)

                    const fromX = fromPosition.left + fromPosition.width
                    const fromY =
                      fromTaskIndex * (viewMode === "compact" ? 30 : 60) + (viewMode === "compact" ? 20 : 30)
                    const toX = toPosition.left
                    const toY = toTaskIndex * (viewMode === "compact" ? 30 : 60) + (viewMode === "compact" ? 20 : 30)

                    // SVG path for the dependency arrow
                    const path = `M${fromX},${fromY} C${fromX + 20},${fromY} ${toX - 20},${toY} ${toX},${toY}`

                    return (
                      <svg
                        key={`${dep.fromTaskId}-${dep.toTaskId}`}
                        className="absolute top-0 left-0 w-full h-full pointer-events-none z-0"
                        style={{
                          width:
                            timeScale === "day"
                              ? `${dates.length * dayWidth}px`
                              : timeScale === "week"
                                ? `${Math.ceil(dates.length / 7) * (7 * dayWidth)}px`
                                : timeScale === "month"
                                  ? `${Math.ceil(dates.length / 30) * (30 * dayWidth)}px`
                                  : timeScale === "quarter"
                                    ? `${Math.ceil(dates.length / 90) * (90 * dayWidth)}px`
                                    : `${Math.ceil(dates.length / 365) * (365 * dayWidth)}px`,
                          height: "100%",
                        }}
                      >
                        <path
                          d={path}
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeDasharray="4 2"
                          className="text-muted-foreground"
                        />
                        <polygon
                          points={`${toX},${toY} ${toX - 5},${toY - 3} ${toX - 5},${toY + 3}`}
                          className="fill-current text-muted-foreground"
                        />
                      </svg>
                    )
                  }),
                )}

              {/* Milestones */}
              {showMilestones &&
                project.milestones.map((milestone) => {
                  const milestoneDate = parseISO(milestone.date)
                  let left = 0

                  switch (timeScale) {
                    case "day":
                      left = differenceInDays(milestoneDate, viewStartDate) * dayWidth
                      break
                    case "week":
                      left = Math.floor(differenceInDays(milestoneDate, viewStartDate) / 7) * (7 * dayWidth)
                      break
                    case "month":
                      const monthOffset =
                        getMonth(milestoneDate) -
                        getMonth(viewStartDate) +
                        (getYear(milestoneDate) - getYear(viewStartDate)) * 12
                      left = monthOffset * (30 * dayWidth)
                      break
                    case "quarter":
                      const quarterOffset =
                        Math.floor(getMonth(milestoneDate) / 3) -
                        Math.floor(getMonth(viewStartDate) / 3) +
                        (getYear(milestoneDate) - getYear(viewStartDate)) * 4
                      left = quarterOffset * (90 * dayWidth)
                      break
                    case "year":
                      left = (getYear(milestoneDate) - getYear(viewStartDate)) * (365 * dayWidth)
                      break
                  }

                  return (
                    <TooltipProvider key={milestone.id}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div
                            className="absolute cursor-pointer z-20"
                            style={{
                              left: `${left}px`,
                              top: "0",
                            }}
                          >
                            <div className="flex flex-col items-center">
                              <Flag className="h-6 w-6" style={{ color: milestone.color || "currentColor" }} />
                              <div
                                className="absolute top-0 bottom-0 border-dashed border-l-2 z-10 pointer-events-none"
                                style={{
                                  borderColor: milestone.color || "currentColor",
                                  height: "100vh",
                                }}
                              />
                            </div>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <div className="font-medium">{milestone.name}</div>
                          <div className="text-xs">
                            {format(parseISO(milestone.date), "d MMMM yyyy", { locale: sv })}
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )
                })}
            </div>
          </div>
        </div>

        {/* Context Menu */}
        {contextMenuPosition && (
          <div
            className="fixed z-50 bg-white rounded-md shadow-md border p-1"
            style={{
              left: `${contextMenuPosition.x}px`,
              top: `${contextMenuPosition.y}px`,
            }}
          >
            <div className="text-xs font-medium px-2 py-1 text-muted-foreground">
              {project.tasks.find((t) => t.id === contextMenuTaskId)?.name}
            </div>
            <DropdownMenuSeparator />
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start text-sm"
              onClick={() => {
                if (contextMenuTaskId) {
                  handleStartInlineEdit(contextMenuTaskId)
                }
                setContextMenuPosition(null)
              }}
            >
              Redigera
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start text-sm"
              onClick={() => {
                if (contextMenuTaskId) {
                  setProjects((prev) =>
                    prev.map((p) => {
                      if (p.id === activeProject) {
                        return {
                          ...p,
                          tasks: p.tasks.map((task) =>
                            task.id === contextMenuTaskId ? { ...task, status: "completed", progress: 100 } : task,
                          ),
                        }
                      }
                      return p
                    }),
                  )
                }
                setContextMenuPosition(null)
              }}
            >
              Markera som slutförd
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start text-sm"
              onClick={() => {
                if (contextMenuTaskId) {
                  setProjects((prev) =>
                    prev.map((p) => {
                      if (p.id === activeProject) {
                        return {
                          ...p,
                          tasks: p.tasks.filter((task) => task.id !== contextMenuTaskId),
                        }
                      }
                      return p
                    }),
                  )
                }
                setContextMenuPosition(null)
              }}
            >
              Ta bort
            </Button>
            <DropdownMenuSeparator />
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start text-sm"
              onClick={() => {
                setContextMenuPosition(null)
              }}
            >
              Avbryt
            </Button>
          </div>
        )}

        {/* Click away listener for context menu */}
        {contextMenuPosition && <div className="fixed inset-0 z-40" onClick={() => setContextMenuPosition(null)} />}

        {selectedTask && (
          <div className="border-t p-4">
            <Tabs defaultValue="details">
              <TabsList>
                <TabsTrigger value="details">Detaljer</TabsTrigger>
                <TabsTrigger value="resources">Resurser</TabsTrigger>
                <TabsTrigger value="dependencies">Beroenden</TabsTrigger>
                <TabsTrigger value="notes">Anteckningar</TabsTrigger>
              </TabsList>
              <TabsContent value="details" className="p-4">
                {(() => {
                  const task = project.tasks.find((t) => t.id === selectedTask)
                  if (!task) return null

                  return (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h3 className="font-bold text-lg">{task.name}</h3>
                        <p className="text-muted-foreground">{task.description}</p>

                        <div className="mt-4 grid grid-cols-2 gap-2">
                          <div>
                            <div className="text-sm font-medium">Startdatum</div>
                            <div className="flex items-center gap-2">
                              {editingTask === selectedTask ? (
                                <Input
                                  type="date"
                                  value={task.startDate}
                                  onChange={(e) => handleSaveInlineEditValue(task.id, "startDate", e.target.value)}
                                  className="h-8 py-0 text-sm"
                                />
                              ) : (
                                <div onDoubleClick={() => handleStartInlineEdit(task.id)}>
                                  {format(parseISO(task.startDate), "d MMMM yyyy", { locale: sv })}
                                </div>
                              )}
                            </div>
                          </div>
                          <div>
                            <div className="text-sm font-medium">Slutdatum</div>
                            <div className="flex items-center gap-2">
                              {editingTask === selectedTask ? (
                                <Input
                                  type="date"
                                  value={task.endDate}
                                  onChange={(e) => handleSaveInlineEditValue(task.id, "endDate", e.target.value)}
                                  className="h-8 py-0 text-sm"
                                />
                              ) : (
                                <div onDoubleClick={() => handleStartInlineEdit(task.id)}>
                                  {format(parseISO(task.endDate), "d MMMM yyyy", { locale: sv })}
                                </div>
                              )}
                            </div>
                          </div>
                          <div>
                            <div className="text-sm font-medium">Status</div>
                            <div className="flex items-center gap-2">
                              {editingTask === selectedTask ? (
                                <select
                                  value={task.status}
                                  onChange={(e) =>
                                    handleSaveInlineEditValue(task.id, "status", e.target.value as TaskStatus)
                                  }
                                  className="h-8 py-0 text-sm rounded-md border border-input bg-background px-3"
                                >
                                  <option value="not-started">Ej påbörjad</option>
                                  <option value="in-progress">Pågående</option>
                                  <option value="completed">Slutförd</option>
                                  <option value="delayed">Försenad</option>
                                  <option value="cancelled">Avbruten</option>
                                </select>
                              ) : (
                                <div
                                  className="flex items-center gap-1"
                                  onDoubleClick={() => handleStartInlineEdit(task.id)}
                                >
                                  <div className={`w-2 h-2 rounded-full ${getStatusColor(task.status)}`} />
                                  {task.status === "not-started" && "Ej påbörjad"}
                                  {task.status === "in-progress" && "Pågående"}
                                  {task.status === "completed" && "Slutförd"}
                                  {task.status === "delayed" && "Försenad"}
                                  {task.status === "cancelled" && "Avbruten"}
                                </div>
                              )}
                            </div>
                          </div>
                          <div>
                            <div className="text-sm font-medium">Prioritet</div>
                            <div className="flex items-center gap-2">
                              {editingTask === selectedTask ? (
                                <select
                                  value={task.priority}
                                  onChange={(e) =>
                                    handleSaveInlineEditValue(task.id, "priority", e.target.value as TaskPriority)
                                  }
                                  className="h-8 py-0 text-sm rounded-md border border-input bg-background px-3"
                                >
                                  <option value="low">Låg</option>
                                  <option value="medium">Medium</option>
                                  <option value="high">Hög</option>
                                  <option value="critical">Kritisk</option>
                                </select>
                              ) : (
                                <div
                                  className="flex items-center gap-1"
                                  onDoubleClick={() => handleStartInlineEdit(task.id)}
                                >
                                  <div className={`w-2 h-2 rounded-full ${getPriorityColor(task.priority)}`} />
                                  {task.priority === "low" && "Låg"}
                                  {task.priority === "medium" && "Medium"}
                                  {task.priority === "high" && "Hög"}
                                  {task.priority === "critical" && "Kritisk"}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div>
                        <div className="text-sm font-medium">Framsteg</div>
                        <div className="flex items-center gap-2">
                          {editingTask === selectedTask ? (
                            <div className="w-full">
                              <Slider
                                defaultValue={[task.progress]}
                                max={100}
                                step={5}
                                onValueChange={(value) => handleSaveInlineEditValue(task.id, "progress", value[0])}
                              />
                            </div>
                          ) : (
                            <div className="w-full" onDoubleClick={() => handleStartInlineEdit(task.id)}>
                              <div className="w-full bg-muted rounded-full h-2.5">
                                <div
                                  className="bg-primary h-2.5 rounded-full"
                                  style={{ width: `${task.progress}%` }}
                                ></div>
                              </div>
                            </div>
                          )}
                          <span>{task.progress}%</span>
                        </div>

                        <div className="mt-4">
                          <div className="text-sm font-medium">Resurser</div>
                          <div className="flex flex-wrap gap-2 mt-1">
                            {task.resources.map((resourceId) => {
                              const resource = project.resources.find((r) => r.id === resourceId)
                              if (!resource) return null

                              return (
                                <div
                                  key={resourceId}
                                  className="flex items-center gap-2 bg-muted rounded-full px-2 py-1"
                                >
                                  <Avatar className="h-6 w-6">
                                    <AvatarImage src={resource.avatar} alt={resource.name} />
                                    <AvatarFallback style={{ backgroundColor: resource.color }}>
                                      {resource.name.substring(0, 2)}
                                    </AvatarFallback>
                                  </Avatar>
                                  <span className="text-sm">{resource.name}</span>
                                </div>
                              )
                            })}

                            {editingTask === selectedTask && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="rounded-full h-7"
                                onClick={() => {
                                  // Open resource selection
                                }}
                              >
                                <Plus className="h-3 w-3 mr-1" />
                                Lägg till
                              </Button>
                            )}
                          </div>
                        </div>

                        <div className="mt-4">
                          <div className="text-sm font-medium">Beroenden</div>
                          <div className="flex flex-col gap-1 mt-1">
                            {task.dependencies.length === 0 && (
                              <div className="text-sm text-muted-foreground">Inga beroenden</div>
                            )}
                            {task.dependencies.map((dep) => {
                              const fromTask = project.tasks.find((t) => t.id === dep.fromTaskId)
                              if (!fromTask) return null

                              return (
                                <div key={`${dep.fromTaskId}-${dep.toTaskId}`} className="flex items-center gap-2">
                                  <Link className="h-4 w-4" />
                                  <span className="text-sm">
                                    {fromTask.name} ({dep.type})
                                  </span>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })()}
              </TabsContent>
              <TabsContent value="resources" className="p-4">
                <div className="grid grid-cols-2 gap-4">
                  {project.resources.map((resource) => (
                    <div key={resource.id} className="flex items-center gap-3 p-3 border rounded-lg">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={resource.avatar} alt={resource.name} />
                        <AvatarFallback style={{ backgroundColor: resource.color }}>
                          {resource.name.substring(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{resource.name}</div>
                        <div className="text-sm text-muted-foreground">{resource.role}</div>
                        <div className="text-xs">Tillgänglighet: {resource.availability}%</div>
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>
              <TabsContent value="dependencies" className="p-4">
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium">Beroenden</h3>
                    <Button size="sm">
                      <Plus className="h-4 w-4 mr-1" />
                      Lägg till beroende
                    </Button>
                  </div>

                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-muted">
                          <th className="text-left p-2">Från uppgift</th>
                          <th className="text-left p-2">Till uppgift</th>
                          <th className="text-left p-2">Typ</th>
                          <th className="text-left p-2">Åtgärder</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(() => {
                          const task = project.tasks.find((t) => t.id === selectedTask)
                          if (!task) return null

                          if (task.dependencies.length === 0) {
                            return (
                              <tr>
                                <td colSpan={4} className="p-4 text-center text-muted-foreground">
                                  Inga beroenden hittades
                                </td>
                              </tr>
                            )
                          }

                          return task.dependencies.map((dep) => {
                            const fromTask = project.tasks.find((t) => t.id === dep.fromTaskId)
                            if (!fromTask) return null

                            return (
                              <tr key={`${dep.fromTaskId}-${dep.toTaskId}`} className="border-t">
                                <td className="p-2">{fromTask.name}</td>
                                <td className="p-2">{task.name}</td>
                                <td className="p-2">
                                  {dep.type === "finish-to-start" && "Avsluta till start"}
                                  {dep.type === "start-to-start" && "Start till start"}
                                  {dep.type === "finish-to-finish" && "Avsluta till avsluta"}
                                  {dep.type === "start-to-finish" && "Start till avsluta"}
                                </td>
                                <td className="p-2">
                                  <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <AlertCircle className="h-4 w-4" />
                                  </Button>
                                </td>
                              </tr>
                            )
                          })
                        })()}
                      </tbody>
                    </table>
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="notes" className="p-4">
                <div className="flex flex-col gap-2">
                  <h3 className="font-medium">Anteckningar</h3>
                  <Textarea placeholder="Lägg till anteckningar om denna uppgift här..." className="min-h-[200px]" />
                  <div className="flex justify-end">
                    <Button>Spara anteckningar</Button>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </CardContent>
    </Card>
  )

  // Lägg till denna dialog för att redigera uppgifter/faser
  return (
    <>
      <Dialog open={isEditingTask} onOpenChange={setIsEditingTask}>
        <DialogContent className="sm:max-w-[600px]">
          {(() => {
            const task = project.tasks.find((t) => t.id === taskToEdit)
            if (!task) return null

            return (
              <>
                <DialogHeader>
                  <DialogTitle>{task.isPhase ? "Redigera fas" : "Redigera uppgift"}</DialogTitle>
                  <DialogDescription>
                    Uppdatera information om {task.isPhase ? "fasen" : "uppgiften"}.
                  </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                  <Tabs defaultValue="general">
                    <TabsList className="grid grid-cols-3">
                      <TabsTrigger value="general">Allmänt</TabsTrigger>
                      <TabsTrigger value="resources">Resurser</TabsTrigger>
                      <TabsTrigger value="dependencies">Beroenden</TabsTrigger>
                    </TabsList>

                    <TabsContent value="general" className="space-y-4 mt-4">
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="edit-name" className="text-right">
                          Namn
                        </Label>
                        <Input
                          id="edit-name"
                          value={task.name}
                          onChange={(e) =>
                            setProjects((prev) =>
                              prev.map((p) => {
                                if (p.id === activeProject) {
                                  return {
                                    ...p,
                                    tasks: p.tasks.map((t) => (t.id === task.id ? { ...t, name: e.target.value } : t)),
                                  }
                                }
                                return p
                              }),
                            )
                          }
                          className="col-span-3"
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="edit-description" className="text-right">
                          Beskrivning
                        </Label>
                        <Textarea
                          id="edit-description"
                          value={task.description || ""}
                          onChange={(e) =>
                            setProjects((prev) =>
                              prev.map((p) => {
                                if (p.id === activeProject) {
                                  return {
                                    ...p,
                                    tasks: p.tasks.map((t) =>
                                      t.id === task.id ? { ...t, description: e.target.value } : t,
                                    ),
                                  }
                                }
                                return p
                              }),
                            )
                          }
                          className="col-span-3"
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="edit-startDate" className="text-right">
                          Startdatum
                        </Label>
                        <Input
                          id="edit-startDate"
                          type="date"
                          value={task.startDate}
                          onChange={(e) =>
                            setProjects((prev) =>
                              prev.map((p) => {
                                if (p.id === activeProject) {
                                  return {
                                    ...p,
                                    tasks: p.tasks.map((t) =>
                                      t.id === task.id ? { ...t, startDate: e.target.value } : t,
                                    ),
                                  }
                                }
                                return p
                              }),
                            )
                          }
                          className="col-span-3"
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="edit-endDate" className="text-right">
                          Slutdatum
                        </Label>
                        <Input
                          id="edit-endDate"
                          type="date"
                          value={task.endDate}
                          onChange={(e) =>
                            setProjects((prev) =>
                              prev.map((p) => {
                                if (p.id === activeProject) {
                                  return {
                                    ...p,
                                    tasks: p.tasks.map((t) =>
                                      t.id === task.id ? { ...t, endDate: e.target.value } : t,
                                    ),
                                  }
                                }
                                return p
                              }),
                            )
                          }
                          className="col-span-3"
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="edit-status" className="text-right">
                          Status
                        </Label>
                        <select
                          id="edit-status"
                          value={task.status}
                          onChange={(e) =>
                            setProjects((prev) =>
                              prev.map((p) => {
                                if (p.id === activeProject) {
                                  return {
                                    ...p,
                                    tasks: p.tasks.map((t) =>
                                      t.id === task.id ? { ...t, status: e.target.value as TaskStatus } : t,
                                    ),
                                  }
                                }
                                return p
                              }),
                            )
                          }
                          className="col-span-3 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <option value="not-started">Ej påbörjad</option>
                          <option value="in-progress">Pågående</option>
                          <option value="completed">Slutförd</option>
                          <option value="delayed">Försenad</option>
                          <option value="cancelled">Avbruten</option>
                        </select>
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="edit-priority" className="text-right">
                          Prioritet
                        </Label>
                        <select
                          id="edit-priority"
                          value={task.priority}
                          onChange={(e) =>
                            setProjects((prev) =>
                              prev.map((p) => {
                                if (p.id === activeProject) {
                                  return {
                                    ...p,
                                    tasks: p.tasks.map((t) =>
                                      t.id === task.id ? { ...t, priority: e.target.value as TaskPriority } : t,
                                    ),
                                  }
                                }
                                return p
                              }),
                            )
                          }
                          className="col-span-3 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <option value="low">Låg</option>
                          <option value="medium">Medium</option>
                          <option value="high">Hög</option>
                          <option value="critical">Kritisk</option>
                        </select>
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="edit-progress" className="text-right">
                          Framsteg ({task.progress}%)
                        </Label>
                        <div className="col-span-3">
                          <Slider
                            id="edit-progress"
                            defaultValue={[task.progress]}
                            max={100}
                            step={5}
                            onValueChange={(value) =>
                              setProjects((prev) =>
                                prev.map((p) => {
                                  if (p.id === activeProject) {
                                    return {
                                      ...p,
                                      tasks: p.tasks.map((t) => (t.id === task.id ? { ...t, progress: value[0] } : t)),
                                    }
                                  }
                                  return p
                                }),
                              )
                            }
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="edit-color" className="text-right">
                          Färg
                        </Label>
                        <Input
                          id="edit-color"
                          type="color"
                          value={task.color || "#0891b2"}
                          onChange={(e) =>
                            setProjects((prev) =>
                              prev.map((p) => {
                                if (p.id === activeProject) {
                                  return {
                                    ...p,
                                    tasks: p.tasks.map((t) => (t.id === task.id ? { ...t, color: e.target.value } : t)),
                                  }
                                }
                                return p
                              }),
                            )
                          }
                          className="col-span-3 h-10 w-full"
                        />
                      </div>
                    </TabsContent>

                    <TabsContent value="resources" className="space-y-4 mt-4">
                      <div className="grid grid-cols-1 gap-4">
                        <Label className="mb-2">Tilldelade resurser</Label>
                        <div className="border rounded-md p-4 space-y-2">
                          {project.resources.map((resource) => (
                            <div key={resource.id} className="flex items-center gap-2">
                              <Checkbox
                                id={`resource-${resource.id}`}
                                checked={task.resources.includes(resource.id)}
                                onCheckedChange={(checked) => {
                                  setProjects((prev) =>
                                    prev.map((p) => {
                                      if (p.id === activeProject) {
                                        return {
                                          ...p,
                                          tasks: p.tasks.map((t) => {
                                            if (t.id === task.id) {
                                              if (checked) {
                                                return { ...t, resources: [...t.resources, resource.id] }
                                              } else {
                                                return {
                                                  ...t,
                                                  resources: t.resources.filter((id) => id !== resource.id),
                                                }
                                              }
                                            }
                                            return t
                                          }),
                                        }
                                      }
                                      return p
                                    }),
                                  )
                                }}
                              />
                              <label
                                htmlFor={`resource-${resource.id}`}
                                className="flex items-center gap-2 cursor-pointer"
                              >
                                <Avatar className="h-6 w-6">
                                  <AvatarImage src={resource.avatar} alt={resource.name} />
                                  <AvatarFallback style={{ backgroundColor: resource.color }}>
                                    {resource.name.substring(0, 2)}
                                  </AvatarFallback>
                                </Avatar>
                                <span>
                                  {resource.name} - {resource.role}
                                </span>
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="dependencies" className="space-y-4 mt-4">
                      <div className="grid grid-cols-1 gap-4">
                        <Label className="mb-2">Beroenden</Label>
                        <div className="border rounded-md p-4">
                          {task.dependencies.length === 0 ? (
                            <div className="text-center text-muted-foreground py-4">Inga beroenden har lagts till</div>
                          ) : (
                            <div className="space-y-2">
                              {task.dependencies.map((dep, index) => {
                                const fromTask = project.tasks.find((t) => t.id === dep.fromTaskId)
                                if (!fromTask) return null

                                return (
                                  <div key={index} className="flex items-center justify-between gap-2 border-b pb-2">
                                    <div className="flex items-center gap-2">
                                      <Link className="h-4 w-4" />
                                      <span>{fromTask.name}</span>
                                      <span className="text-xs text-muted-foreground">
                                        (
                                        {dep.type === "finish-to-start"
                                          ? "Avsluta till start"
                                          : dep.type === "start-to-start"
                                            ? "Start till start"
                                            : dep.type === "finish-to-finish"
                                              ? "Avsluta till avsluta"
                                              : "Start till avsluta"}
                                        )
                                      </span>
                                    </div>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => {
                                        setProjects((prev) =>
                                          prev.map((p) => {
                                            if (p.id === activeProject) {
                                              return {
                                                ...p,
                                                tasks: p.tasks.map((t) => {
                                                  if (t.id === task.id) {
                                                    return {
                                                      ...t,
                                                      dependencies: t.dependencies.filter((_, i) => i !== index),
                                                    }
                                                  }
                                                  return t
                                                }),
                                              }
                                            }
                                            return p
                                          }),
                                        )
                                      }}
                                    >
                                      <AlertCircle className="h-4 w-4" />
                                    </Button>
                                  </div>
                                )
                              })}
                            </div>
                          )}

                          <div className="mt-4 space-y-2">
                            <Label>Lägg till nytt beroende</Label>
                            <div className="flex items-center gap-2">
                              <select
                                className="flex-1 h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                                onChange={(e) => {
                                  if (!e.target.value) return

                                  setProjects((prev) =>
                                    prev.map((p) => {
                                      if (p.id === activeProject) {
                                        return {
                                          ...p,
                                          tasks: p.tasks.map((t) => {
                                            if (t.id === task.id) {
                                              return {
                                                ...t,
                                                dependencies: [
                                                  ...t.dependencies,
                                                  {
                                                    fromTaskId: e.target.value,
                                                    toTaskId: task.id,
                                                    type: "finish-to-start",
                                                  },
                                                ],
                                              }
                                            }
                                            return t
                                          }),
                                        }
                                      }
                                      return p
                                    }),
                                  )

                                  // Reset select
                                  e.target.value = ""
                                }}
                              >
                                <option value="">Välj uppgift...</option>
                                {project.tasks
                                  .filter(
                                    (t) =>
                                      t.id !== task.id && !task.dependencies.some((dep) => dep.fromTaskId === t.id),
                                  )
                                  .map((t) => (
                                    <option key={t.id} value={t.id}>
                                      {t.name}
                                    </option>
                                  ))}
                              </select>
                            </div>
                          </div>
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>
                </div>

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsEditingTask(false)}>
                    Avbryt
                  </Button>
                  <Button
                    type="button"
                    onClick={() => {
                      // Om det är en fas, uppdatera framsteget baserat på underuppgifter
                      if (task.isPhase) {
                        updateAllPhaseProgress()
                      }
                      setIsEditingTask(false)
                    }}
                  >
                    Spara
                  </Button>
                </DialogFooter>
              </>
            )
          })()}
        </DialogContent>
      </Dialog>
    </>
  )
}

