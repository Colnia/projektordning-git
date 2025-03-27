"use client"

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { addDays, format, differenceInDays, addMonths, startOfMonth, endOfMonth, eachDayOfInterval, subMonths, isWeekend, parse, max, min, eachMonthOfInterval, getDate, getDaysInMonth, setMonth, getDay } from 'date-fns'
import { sv } from 'date-fns/locale'
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, ArrowLeft, ArrowRight, Plus, Calendar, Users, CalendarDays, AlertTriangle, User, CheckCircle } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { toast } from "@/components/ui/use-toast"
import { v4 as uuidv4 } from 'uuid'
import { PhaseEditDialog } from "../components/phase-edit-dialog"

interface Project {
  id: string | number;
  name: string;
  startDate: string;
  endDate: string;
  status: string;
  phases: Phase[];
  resources?: ResourceAssignment[];
  color?: string;
}

interface Phase {
  id: string | number;
  name: string;
  startDate: string;
  endDate: string;
  status: string;
  projectId: string | number;
  color?: string;
  completionRate: number;
  description?: string;
  priority?: number;
  isBlocker?: boolean;
  isTemporary?: boolean;
  resources: Array<{
    id: string | number;
    name: string;
    hoursPerDay: number;
  }>;
}

interface Resource {
  id: string | number;
  name: string;
  type: string;
  availability: number; // Tillgängliga timmar per vecka
}

interface ResourceAssignment {
  id: string | number;
  resourceId: string | number;
  resourceName: string;
  phaseId: string | number;
  phaseName: string;
  projectId?: string | number;
  projectName?: string;
  startDate: string;
  endDate: string;
  hoursPerDay: number;
}

// Funktion som genererar månadsrubriker och beräknar dagar för varje månad
const calculateDateRange = (startMonth: Date, viewMonthsCount: number) => {
  // Säkerställ att vi arbetar med korrekt startdatum (första dagen i månaden)
  const start = startOfMonth(startMonth);
  // Beräkna slutdatum baserat på antal månader
  const end = endOfMonth(addMonths(start, viewMonthsCount - 1));
  
  console.log(`Beräknar datumintervall: ${format(start, 'yyyy-MM-dd')} till ${format(end, 'yyyy-MM-dd')}, ${viewMonthsCount} månader`);
  
  // Generera array med månader i det valda intervallet
  const monthsInView = [];
  let currentMonth = start;
  while (currentMonth <= end) {
    monthsInView.push(currentMonth);
    currentMonth = addMonths(currentMonth, 1);
  }
  
  console.log(`Antal månader i vyn: ${monthsInView.length}`);
  
  // Skapa månadsrubriker
  const monthHeaders = monthsInView.map(month => ({
    month: month,
    name: format(month, 'MMM yyyy', { locale: sv }),
  }));
  
  // Generera alla dagar i intervallet
  const allDaysInRange = eachDayOfInterval({
    start: start,
    end: end
  }).map(day => ({
    date: day,
    isWeekend: isWeekend(day)
  }));
  
  // Gruppera dagar per månad
  const daysInMonths = monthsInView.map(month => {
    const monthStart = startOfMonth(month);
    const monthEnd = endOfMonth(month);
    return eachDayOfInterval({ start: monthStart, end: monthEnd }).map(day => ({
      date: day,
      isWeekend: isWeekend(day)
    }));
  });
  
  // Beräkna antal dagar per månad för breddberäkning
  const daysCountPerMonth = monthsInView.map(month => getDaysInMonth(month));
  
  // Beräkna totalt antal dagar i vyn
  const totalDays = differenceInDays(end, start) + 1;
  
  console.log(`Totalt antal dagar i vyn: ${totalDays}`);
  
  return {
    startDate: start,
    endDate: end,
    totalDays: totalDays,
    monthHeaders: monthHeaders,
    daysInMonths: daysInMonths,
    daysCountPerMonth: daysCountPerMonth,
    allDaysInRange: allDaysInRange
  };
};

// Hjälpfunktion för att rendera fasstaplar
const renderPhaseBar = (phase: any, startDate: Date, endDate: Date, totalDays: number, dayWidth: number = 30) => {
  if (!phase.startDate || !phase.endDate) return null;
  
  // Konvertera datum till Date-objekt om de är strängar
  const phaseStart = typeof phase.startDate === 'string' 
    ? new Date(phase.startDate) 
    : phase.startDate;
    
  const phaseEnd = typeof phase.endDate === 'string'
    ? new Date(phase.endDate)
    : phase.endDate;
  
  // Räkna ut fasens position relativt till Gantt-diagrammets start- och slutdatum
  const daysFromStart = Math.max(0, differenceInDays(phaseStart, startDate));
  const phaseDuration = Math.min(
    differenceInDays(phaseEnd, phaseStart) + 1,
    differenceInDays(endDate, phaseStart) + 1
  );
  
  // Beräkna position och bredd i pixel med hänsyn till dagbredd
  const leftPosition = daysFromStart * dayWidth;
  const barWidth = phaseDuration * dayWidth;
  
  // Skippa rendering om fasen är helt utanför diagrammet
  if (daysFromStart > totalDays || daysFromStart + phaseDuration < 0) {
    return null;
  }
  
  console.log(`Rendering phase bar for ${phase.name}, id: ${phase.id}, status: ${phase.status}`);
  
  // Använd bara statusfärger (fasta färger baserat på status)
  let backgroundColor = '';
  let statusColor = '';
  
  // Bestäm färg baserat på status - ignorera helt phase.color
  if (phase.status === 'completed') {
    backgroundColor = '#34A853'; // Grön för avslutade faser
    statusColor = 'bg-green-500';
  } else if (phase.status === 'inProgress' || phase.status === 'in progress') {
    backgroundColor = '#4285F4'; // Blå för pågående faser
    statusColor = 'bg-blue-500';
  } else if (phase.status === 'delayed') {
    backgroundColor = '#EA4335'; // Röd för försenade faser
    statusColor = 'bg-red-500';
  } else if (phase.status === 'notStarted' || phase.status === 'not started') {
    backgroundColor = '#FBBC05'; // Gul för inte påbörjade faser
    statusColor = 'bg-yellow-400';
  } else {
    // Standardfärg om ingen matchande status hittas
    console.log(`Okänd status: "${phase.status}" för fas: ${phase.name}. Använder standardfärg.`);
    backgroundColor = '#FBBC05'; // Gul för okänd status
    statusColor = 'bg-yellow-400';
  }
  
  // Anpassa visning av text baserat på stapelns bredd och dagbredd
  const shouldShowText = barWidth > 50 || (dayWidth < 15 && barWidth > 30);
  
  return (
    <div 
      className={`absolute top-1 h-8 ${statusColor} rounded-md border border-background z-10 flex items-center justify-center text-xs text-white font-medium`}
      style={{
        left: `${leftPosition}px`,
        width: `${barWidth}px`,
        minWidth: '10px',
        backgroundColor: backgroundColor
      }}
      title={`${phase.name}: ${format(phaseStart, 'yyyy-MM-dd')} till ${format(phaseEnd, 'yyyy-MM-dd')}, Status: ${phase.status}`}
      data-phase-id={phase.id}
    >
      {shouldShowText ? phase.name : ''}
    </div>
  );
};

export function GanttView({ projects = [], resources = [], assignments = [] }: { 
  projects: Project[], 
  resources: Resource[],
  assignments: ResourceAssignment[]
}) {
  const [startMonth, setStartMonth] = useState<Date>(() => startOfMonth(new Date()));
  const [viewMonths, setViewMonths] = useState<number>(3);
  const [phases, setPhases] = useState<Phase[]>([]);
  const [projectsData, setProjectsData] = useState<Project[]>(projects);
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedPhase, setSelectedPhase] = useState<Phase | null>(null)
  const [isPhaseDialogOpen, setIsPhaseDialogOpen] = useState(false)
  const [isPhaseEditDialogOpen, setIsPhaseEditDialogOpen] = useState(false)
  const [editingPhase, setEditingPhase] = useState<{
    name: string;
    startDate: Date;
    endDate: Date;
    status: string;
    description: string;
    priority: number;
    isBlocker: boolean;
    completionRate: number;
    resources: Array<{id: string | number, name: string, hoursPerDay: number}>;
  } | null>(null)
  const [viewMode, setViewMode] = useState<'phases' | 'resources'>('phases')
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null)
  const [isResourceDialogOpen, setIsResourceDialogOpen] = useState(false)
  const [isResourceSelectionDialogOpen, setIsResourceSelectionDialogOpen] = useState(false)
  const [availableResourcesForSelection, setAvailableResourcesForSelection] = useState<Resource[]>([])
  const [selectedResourceToAdd, setSelectedResourceToAdd] = useState<string>("")
  
  // Använd useRef för att hantera tvingad omrendering vid färguppdateringar
  const forceUpdateKey = useRef(0);
  
  // Lokalt state för assignments som kan uppdateras utan att ladda om sidan
  const [localAssignments, setLocalAssignments] = useState<ResourceAssignment[]>(assignments)
  
  // Uppdatera lokalt state när assignments ändras från props
  useEffect(() => {
    setLocalAssignments(assignments);
  }, [assignments]);
  
  // Extrahera faser från projekten för att hantera dem separat
  useEffect(() => {
    const allPhases: Phase[] = [];
    
    projects.forEach(project => {
      project.phases.forEach(phase => {
        allPhases.push({
          ...phase,
          projectId: project.id,
          status: phase.status || 'notStarted', // Se till att status alltid finns
        });
      });
    });
    
    setPhases(allPhases);
  }, [projects]);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState<number>(0);
  
  // Mät containerns bredd när komponenten laddas och vid förändringar
  useEffect(() => {
    if (!containerRef.current) return;
    
    const updateWidth = () => {
      if (!containerRef.current) return;
      // Få containerns bredd minus bredd för vänsterkolumnen (250px)
      const newWidth = containerRef.current.offsetWidth - 250;
      setContainerWidth(newWidth > 0 ? newWidth : 0);
    };
    
    // Initial mätning
    updateWidth();
    
    // Mät om vid förändringar i fönsterstorlek
    const resizeObserver = new ResizeObserver(updateWidth);
    resizeObserver.observe(containerRef.current);
    
    // Städa upp
    return () => {
      if (containerRef.current) {
        resizeObserver.unobserve(containerRef.current);
      }
      resizeObserver.disconnect();
    };
  }, []);
  
  // Filtrera projekt baserat på sökfrågan
  const filteredProjects = projects.filter(project => 
    project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    project.status.toLowerCase().includes(searchQuery.toLowerCase())
  )
  
  // Funktion för att hämta planeringsdata
  const fetchPlanningData = async () => {
    try {
      console.log("Hämtar all planeringsdata...");
      
      const response = await fetch('/api/planning');
      if (!response.ok) {
        throw new Error('Kunde inte hämta planeringsdata');
      }
      
      const data = await response.json();
      
      // Extrahera faser från projekt för separata uppdateringar
      const allPhases: Phase[] = [];
      data.projects.forEach((project: Project) => {
        if (project.phases && Array.isArray(project.phases)) {
          // Se till att varje fas har korrekt color-fält och status
          const phasesWithColor = project.phases.map((phase: Phase) => {
            // Logga detaljerad information om varje fas och dess färg
            console.log(`Fas från API: ${phase.name}, id: ${phase.id}, status: ${phase.status}`);
            
            // Säkerställ att status finns, även om det är null eller undefined
            return {
              ...phase,
              status: phase.status || 'notStarted', // Se till att status alltid finns
            };
          });
          allPhases.push(...phasesWithColor);
        }
      });
      
      // Uppdatera lokalt state
      console.log("Uppdaterar projectsData och phases...");
      setProjectsData(data.projects);
      setPhases(allPhases);
      setLocalAssignments(data.assignments || []);
      
      // Tvinga fram en omrendering för att säkerställa att färger och statusar visas korrekt
      forceUpdateKey.current += 1;
      
      // Logga information om faserna för att verifiera att de innehåller statusinfo
      console.log("Färdigt med att hämta planeringsdata. Antal faser:", allPhases.length);
    } catch (error) {
      console.error('Fel vid hämtning av planeringsdata:', error);
      toast({
        title: "Fel vid hämtning av data",
        description: error instanceof Error ? error.message : "Kunde inte hämta planeringsdata",
        variant: "destructive"
      });
    }
  };
  
  // Beräkna datumintervall med memoization för att undvika onödiga beräkningar
  const dateRange = useMemo(() => {
    console.log(`Uppdaterar dateRange med startMonth=${format(startMonth, 'yyyy-MM-dd')} och viewMonths=${viewMonths}`);
    return calculateDateRange(startMonth, viewMonths);
  }, [startMonth, viewMonths]);
  
  // Beräkna dagbredd baserat på antal månader som ska visas och tillgänglig bredd
  const dayWidth = useMemo(() => {
    if (containerWidth <= 0) {
      // Standardvärden om containerns bredd inte är känd än
      if (viewMonths <= 1) return 30;
      if (viewMonths <= 3) return 20;
      if (viewMonths <= 6) return 10;
      if (viewMonths <= 9) return 6;
      return 4;
    }
    
    // Dynamisk breddberäkning baserad på tillgänglig bredd och antal dagar
    // Lägg till lite mellanrum (0.9) för att undvika horisontell scrollning i onödan
    const calculatedWidth = (containerWidth * 0.9) / dateRange.totalDays;
    
    // Sätt minsta bredd för att säkerställa användbarhet
    const minWidth = viewMonths > 9 ? 4 : viewMonths > 6 ? 5 : viewMonths > 3 ? 8 : 15;
    
    // Returnera det högre värdet av beräknad bredd och minsta bredd
    return Math.max(calculatedWidth, minWidth);
  }, [containerWidth, dateRange.totalDays, viewMonths]);
  
  // Navigera mellan månader i Gantt-schemat
  const handlePreviousMonth = useCallback(() => {
    console.log("Navigerar till föregående månad");
    setStartMonth(prevDate => addMonths(prevDate, -1));
  }, []);
  
  const handleNextMonth = useCallback(() => {
    console.log("Navigerar till nästa månad");
    setStartMonth(prevDate => addMonths(prevDate, 1));
  }, []);
  
  const handleGoToToday = useCallback(() => {
    console.log("Navigerar till aktuell månad");
    setStartMonth(startOfMonth(new Date()));
  }, []);
  
  // Hantera ändring av visningsperiod
  const handleViewMonthsChange = useCallback((value: string) => {
    const newViewMonths = Number(value);
    console.log(`Ändrar visningsperiod från ${viewMonths} till ${newViewMonths} månader`);
    setViewMonths(newViewMonths);
  }, [viewMonths]);
  
  // Hantera klick på fas för detaljvisning
  const handlePhaseClick = useCallback((phase: Phase) => {
    console.log(`Klickade på fas: ${phase.name}`);
    setSelectedPhase(phase)
    setIsPhaseDialogOpen(true)
  }, []);
  
  const handleResourceAssignmentClick = (resource: Resource) => {
    setSelectedResource(resource)
    setIsResourceDialogOpen(true)
  }
  
  // Beräkna position och bredd för en fas eller resurstilldelning i Gantt-schemat
  const calculateBarPosition = (startDate: string, endDate: string) => {
    const barStartDate = new Date(startDate)
    const barEndDate = new Date(endDate)
    
    // Använd de beräknade datumintervallen från calculateDateRange
    const firstDayOfChart = dateRange.startDate;
    const lastDayOfChart = dateRange.endDate;
    
    // Total bredd av visningsområdet i dagar
    const totalDaysInView = dateRange.totalDays;
    
    // Om stapeln är helt utanför visningsområdet
    if (barStartDate > lastDayOfChart || barEndDate < firstDayOfChart) {
      return {
        left: 0,
        width: 0,
        isVisible: false
      }
    }
    
    // Beräkna relativ position från början av diagrammet
    const startOffset = differenceInDays(
      barStartDate >= firstDayOfChart ? barStartDate : firstDayOfChart,
      firstDayOfChart
    )
    
    // Beräkna stapelns synliga längd
    const visibleEndDate = barEndDate <= lastDayOfChart ? barEndDate : lastDayOfChart
    const visibleStartDate = barStartDate >= firstDayOfChart ? barStartDate : firstDayOfChart
    const barLength = differenceInDays(visibleEndDate, visibleStartDate) + 1
    
    // Beräkna procentuell position och bredd
    const leftPercent = (startOffset / totalDaysInView) * 100
    const widthPercent = (barLength / totalDaysInView) * 100
    
    return {
      left: leftPercent,
      width: widthPercent,
      isVisible: true
    }
  }
  
  // Metod för att konvertera datum till läsbart format
  const formatDateString = (dateString: string) => {
    return format(new Date(dateString), 'd MMM yyyy', { locale: sv })
  }
  
  // Gruppera resurstilldelningar efter resourceId för visning i resursvy
  const assignmentsByResourceId: Record<string, ResourceAssignment[]> = {}
  
  localAssignments.forEach(assignment => {
    const resourceId = String(assignment.resourceId)
    if (!assignmentsByResourceId[resourceId]) {
      assignmentsByResourceId[resourceId] = []
    }
    assignmentsByResourceId[resourceId].push(assignment)
  })
  
  const handleEditPhase = () => {
    if (!selectedPhase) return;
    
    // Hitta projektet för denna fas
    const project = projects.find(p => 
      p.phases.some(phase => String(phase.id) === String(selectedPhase.id))
    );
    
    // Hitta tilldelade resurser för denna fas från localAssignments-listan
    const phaseAssignments = localAssignments.filter(assignment => 
      String(assignment.phaseId) === String(selectedPhase.id)
    );
    
    // Förbered data för redigering
    setEditingPhase({
      name: selectedPhase.name,
      startDate: new Date(selectedPhase.startDate),
      endDate: new Date(selectedPhase.endDate),
      status: selectedPhase.status,
      description: selectedPhase.description || '',
      priority: selectedPhase.priority || 2,
      isBlocker: selectedPhase.isBlocker || false,
      completionRate: selectedPhase.completionRate || 0,
      resources: phaseAssignments.map(assignment => ({
        id: assignment.resourceId,
        name: assignment.resourceName,
        hoursPerDay: assignment.hoursPerDay
      }))
    });
    
    setIsPhaseDialogOpen(false);
    setIsPhaseEditDialogOpen(true);
  };
  
  const handleDeletePhase = async (phaseId: string | number) => {
    try {
      const response = await fetch(`/api/planning/phases?id=${phaseId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Kunde inte ta bort fasen: ${errorText}`);
      }

      await fetchPlanningData();
      toast({
        title: "Fas borttagen",
        description: "Fasen har tagits bort"
      });
    } catch (error) {
      console.error('Fel vid borttagning:', error);
      toast({
        title: "Fel vid borttagning",
        description: error instanceof Error ? error.message : "Kunde inte ta bort fasen",
        variant: "destructive"
      });
    }
  };
  
  const handleSavePhase = async () => {
    try {
      if (!editingPhase || !selectedPhase) return;

      let currentPhaseId = selectedPhase.id;
      let createdPhaseData = null;

      // Om det är en ny fas, skapa den först
      if (!currentPhaseId || selectedPhase.isTemporary) {
        const newPhaseData = {
          name: editingPhase.name,
          description: editingPhase.description || '',
          projectId: selectedPhase.projectId,
          startDate: format(editingPhase.startDate, 'yyyy-MM-dd'),
          endDate: format(editingPhase.endDate, 'yyyy-MM-dd'),
          status: editingPhase.status || 'not started',
          completionRate: 0,
          color: selectedPhase.color || ''
        };

        const createResponse = await fetch('/api/planning/phases/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newPhaseData)
        });

        if (!createResponse.ok) {
          const errorText = await createResponse.text();
          throw new Error(`Kunde inte skapa fasen: ${errorText}`);
        }

        createdPhaseData = await createResponse.json();
        currentPhaseId = createdPhaseData.id;
        console.log('Ny fas skapad med ID:', currentPhaseId);
      }

      // Uppdatera fasen med korrekt ID
      const updatedPhase = {
        id: currentPhaseId,
        name: editingPhase.name,
        startDate: format(editingPhase.startDate, 'yyyy-MM-dd'),
        endDate: format(editingPhase.endDate, 'yyyy-MM-dd'),
        status: editingPhase.status,
        projectId: selectedPhase.projectId,
        color: selectedPhase.color || '',
        description: editingPhase.description || '',
        completionRate: editingPhase.completionRate || 0
      };

      console.log('Uppdaterar fas med data:', updatedPhase);

      const phaseResponse = await fetch('/api/planning/phases', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedPhase)
      });

      if (!phaseResponse.ok) {
        const errorText = await phaseResponse.text();
        throw new Error(`Kunde inte uppdatera fasen: ${errorText}`);
      }

      // Om vi har resurser att tilldela, använd det korrekta fas-ID:t
      if (editingPhase.resources && editingPhase.resources.length > 0) {
        for (const resource of editingPhase.resources) {
          const assignmentData = {
            type: 'assignment',
            assignment: {
              resourceId: String(resource.id),
              projectId: selectedPhase.projectId,
              phaseId: currentPhaseId,
              startDate: format(editingPhase.startDate, 'yyyy-MM-dd'),
              endDate: format(editingPhase.endDate, 'yyyy-MM-dd'),
              hoursPerDay: resource.hoursPerDay || 8
            }
          };

          const assignmentResponse = await fetch('/api/planning', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(assignmentData)
          });

          if (!assignmentResponse.ok) {
            const errorText = await assignmentResponse.text();
            throw new Error(`Kunde inte skapa resurstilldelning: ${errorText}`);
          }
        }
      }

      // Uppdatera UI
      await fetchPlanningData();
      setIsPhaseEditDialogOpen(false);
      
      toast({
        title: "Fas sparad",
        description: "Fasen och resurstilldelningar har uppdaterats"
      });

    } catch (error) {
      console.error('Fel vid sparande:', error);
      toast({
        title: "Fel vid sparande",
        description: error instanceof Error ? error.message : "Kunde inte spara ändringarna",
        variant: "destructive"
      });
    }
  };
  
  const handleAddResource = () => {
    if (!editingPhase || !selectedResourceToAdd) {
      toast({
        title: "Kan inte lägga till resurs",
        description: "Välj en resurs först",
        variant: "destructive"
      });
      return;
    }
    
    console.log("Lägger till resurs:", selectedResourceToAdd);
    
    // Hitta den valda resursen i listan över tillgängliga resurser
    const resourceToAdd = availableResourcesForSelection.find(r => String(r.id) === selectedResourceToAdd);
    if (!resourceToAdd) {
      console.error("Kunde inte hitta den valda resursen med ID:", selectedResourceToAdd);
      toast({
        title: "Kunde inte hitta resursen",
        description: "Den valda resursen kunde inte hittas",
        variant: "destructive"
      });
      return;
    }
    
    // Kontrollera om resursen redan är tillagd i fasen
    const isAlreadyAssigned = editingPhase.resources.some(
      r => String(r.id) === String(resourceToAdd.id)
    );
    
    if (isAlreadyAssigned) {
      toast({
        title: "Resurs redan tilldelad",
        description: `${resourceToAdd.name} är redan tilldelad till denna fas`,
        variant: "destructive"
      });
      return;
    }
    
    // Lägg till resursen i fasen med 8 timmar per dag som standard
    setEditingPhase({
      ...editingPhase,
      resources: [
        ...editingPhase.resources,
        {
          ...resourceToAdd,
          hoursPerDay: 8
        }
      ]
    });
    
    // Återställ vald resurs och stäng dialogen
    setSelectedResourceToAdd("");
    setIsResourceSelectionDialogOpen(false);
    
    toast({
      title: "Resurs tillagd",
      description: `${resourceToAdd.name} har lagts till i fasen`
    });
  };
  
  const handleRemoveResource = (resourceId: string | number) => {
    if (!editingPhase) return;
    
    setEditingPhase({
      ...editingPhase,
      resources: editingPhase.resources.filter(r => r.id !== resourceId)
    });
  };
  
  const handleChangeResourceHours = (resourceId: string | number, hours: number) => {
    if (!editingPhase) return;
    
    setEditingPhase({
      ...editingPhase,
      resources: editingPhase.resources.map(r => 
        r.id === resourceId 
          ? { ...r, hoursPerDay: hours }
          : r
      )
    });
  };
  
  // Funktioner för att öppna och stänga dialogen för resurstilldelning
  const handleOpenResourceDialog = () => {
    if (!editingPhase) return;
    
    // Filtrera bort resurser som redan är tilldelade till fasen
    const assignedResourceIds = editingPhase.resources.map(r => r.id);
    const availableResources = resources.filter(r => !assignedResourceIds.includes(r.id));
    
    if (availableResources.length === 0) {
      toast({
        title: "Inga tillgängliga resurser",
        description: "Alla resurser är redan tilldelade till denna fas.",
        variant: "destructive"
      });
      return;
    }
    
    setAvailableResourcesForSelection(availableResources);
    setSelectedResourceToAdd(""); // Återställ tidigare val
    setIsResourceSelectionDialogOpen(true);
  };
  
  const handleRemoveAssignment = async (assignmentId: string | number) => {
    try {
      // Uppdatera lokalt state först (optimistisk uppdatering)
      setLocalAssignments(prev => 
        prev.filter(assignment => String(assignment.id) !== String(assignmentId))
      );
      
      // Anropa API för att ta bort från databasen
      const response = await fetch(`/api/planning/assignments/delete?id=${assignmentId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        // Om API-anropet misslyckas, återställ till originalvärdet
        setLocalAssignments(assignments);
        throw new Error('Kunde inte ta bort resurstilldelningen');
      }
      
      toast({
        title: "Resurstilldelning borttagen",
        description: "Resursen har tagits bort från fasen"
      });
    } catch (error) {
      console.error("Fel vid borttagning av resurstilldelning:", error);
      toast({
        title: "Fel vid borttagning",
        description: error instanceof Error ? error.message : "Kunde inte ta bort resurstilldelningen. Försök igen.",
        variant: "destructive"
      });
    }
  };
  
  // Hantera skapande av ny fas
  const handleAddPhase = (projectId: string | number) => {
    // Skapa ett temporärt ID för den nya fasen
    const tempId = uuidv4();
    
    // Skapa dagens datum och datum 30 dagar framåt
    const today = new Date();
    const endDate = new Date();
    endDate.setDate(today.getDate() + 30);
    
    // Formatera datum som strängar (YYYY-MM-DD)
    const startDateStr = today.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];
    
    // Skapa den nya fasen
    const newPhase: Phase = {
      id: tempId,
      name: 'Ny fas',
      startDate: startDateStr,
      endDate: endDateStr,
      status: 'not started',
      projectId: projectId,
      color: '',
      completionRate: 0,
      isTemporary: true,  // Markera som temporär
      resources: [],
    };
    
    // Uppdatera lokala faslistan
    setPhases(prevPhases => [...prevPhases, newPhase]);
    
    // Uppdatera projektdatan för att inkludera den nya fasen
    setProjectsData(prevProjects => 
      prevProjects.map(project => 
        project.id === projectId 
          ? { ...project, phases: [...project.phases, newPhase] } 
          : project
      )
    );
    
    // Öppna redigeringsdialogen för den nya fasen
    setEditingPhase({
      name: newPhase.name,
      startDate: new Date(newPhase.startDate),
      endDate: new Date(newPhase.endDate),
      status: newPhase.status,
      description: '',
      priority: 2,
      isBlocker: false,
      completionRate: 0,
      resources: [],
    });
    
    setSelectedPhase(newPhase);
    setIsPhaseEditDialogOpen(true);
  };
  
  // Render Gantt view
  return (
    <div className="flex flex-col w-full h-full border rounded-md overflow-hidden" ref={containerRef} key={forceUpdateKey.current}>
      {/* Kontroller för Gantt-schemat */}
      <div className="flex justify-between items-center p-2 bg-background sticky top-0 z-50 border-b">
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handlePreviousMonth}>
            &lt; Föregående
          </Button>
          <Button variant="outline" size="sm" onClick={handleGoToToday}>
            Idag
          </Button>
          <Button variant="outline" size="sm" onClick={handleNextMonth}>
            Nästa &gt;
          </Button>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="text-sm font-medium">
            Visar: {format(dateRange.startDate, 'MMM yyyy', { locale: sv })} 
            {viewMonths > 1 ? ` - ${format(dateRange.endDate, 'MMM yyyy', { locale: sv })}` : ''}
          </div>
          
          <Select
            value={String(viewMonths)}
            onValueChange={handleViewMonthsChange}
          >
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="3 månader" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">1 månad</SelectItem>
              <SelectItem value="2">2 månader</SelectItem>
              <SelectItem value="3">3 månader</SelectItem>
              <SelectItem value="6">6 månader</SelectItem>
              <SelectItem value="12">12 månader</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      {/* Gantt-diagrammet */}
      <div className="w-full h-full overflow-hidden flex flex-col">
        <div className="flex min-w-max overflow-x-auto">
          {/* Vänsterkolumn med projekt- och fasnamn */}
          <div className="sticky left-0 z-30 bg-background flex flex-col min-w-[250px]">
            {/* Header för vänsterkolumnen */}
            <div className="h-12 border-b border-r bg-muted flex items-end">
              <div className="h-6 w-full flex items-center pl-4 font-medium">
                Projekt / Faser
              </div>
            </div>
            
            {/* Projektnamn och faser */}
            {projects.map((project) => {
              const projectPhases = phases.filter(p => p.projectId === project.id);
              
              return (
                <React.Fragment key={project.id}>
                  {/* Projektrubrik */}
                  <div className="h-10 flex items-center justify-between border-b border-r bg-muted/20 pl-4 pr-2 font-medium">
                    <div className="flex items-center gap-2">
                      <div className={`min-w-[300px] font-medium ${project.color ? `text-${project.color}-700` : ''}`}>
                        {project.name}
                        <Button 
                          onClick={() => handleAddPhase(project.id)} 
                          variant="outline" 
                          size="sm" 
                          className="ml-2"
                        >
                          Lägg till fas
                        </Button>
                      </div>
                    </div>
                  </div>
                  
                  {/* Fasnamn */}
                  {projectPhases.map((phase) => (
                    <div 
                      key={phase.id} 
                      className="h-10 flex items-center border-b border-r pl-8 hover:bg-muted/10 cursor-pointer"
                      onClick={() => handlePhaseClick(phase)}
                    >
                      {phase.name}
                    </div>
                  ))}
                </React.Fragment>
              );
            })}
          </div>
          
          {/* Scrollbar tidsaxel och Gantt-staplar */}
          <div className="flex-1 overflow-x-auto">
            <div style={{ width: `${dateRange.totalDays * dayWidth}px` }}>
              {/* Header med månader och dagar */}
              <div className="sticky top-0 z-20 bg-background">
                {/* Månadsrubriker */}
                <div className="flex h-6 border-b">
                  {dateRange.monthHeaders.map((monthHeader, monthIndex) => {
                    const daysInCurrentMonth = dateRange.daysCountPerMonth[monthIndex];
                    const monthWidth = daysInCurrentMonth * dayWidth; // Anpassad bredd per dag
                    
                    return (
                      <div 
                        key={`month-${monthIndex}`}
                        className="flex-shrink-0 border-r flex items-center justify-center font-medium"
                        style={{ width: `${monthWidth}px` }}
                      >
                        {monthHeader.name}
                      </div>
                    );
                  })}
                </div>
                
                {/* Dagsrubriker - endast visa om det finns tillräckligt utrymme */}
                {dayWidth >= 15 && (
                  <div className="flex h-6 border-b">
                    {dateRange.daysInMonths.flatMap((days, monthIndex) => 
                      days.map((day, dayIndex) => (
                        <div 
                          key={`day-${monthIndex}-${dayIndex}`}
                          className={`flex-shrink-0 flex items-center justify-center text-xs border-r
                            ${day.isWeekend ? 'bg-muted/50' : ''}`}
                          style={{ width: `${dayWidth}px` }}
                        >
                          {format(day.date, 'd')}
                        </div>
                      ))
                    )}
                  </div>
                )}
                
                {/* För mindre zoomnivåer, visa bara veckans dagar eller viktiga datum */}
                {dayWidth < 15 && dayWidth >= 5 && (
                  <div className="flex h-6 border-b">
                    {dateRange.daysInMonths.flatMap((days, monthIndex) => 
                      days.map((day, dayIndex) => {
                        const isFirstDayOfWeek = getDate(day.date) === 1 || dayIndex === 0 || getDay(day.date) === 1;
                        return (
                          <div 
                            key={`day-${monthIndex}-${dayIndex}`}
                            className={`flex-shrink-0 flex items-center justify-center text-xs border-r
                              ${day.isWeekend ? 'bg-muted/50' : ''}`}
                            style={{ width: `${dayWidth}px` }}
                          >
                            {isFirstDayOfWeek ? format(day.date, 'd') : ''}
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
                
                {/* För mycket låga zoomnivåer, visa bara datum den 1:a och 15:e */}
                {dayWidth < 5 && (
                  <div className="flex h-6 border-b">
                    {dateRange.daysInMonths.flatMap((days, monthIndex) => 
                      days.map((day, dayIndex) => {
                        const isSpecialDay = getDate(day.date) === 1 || getDate(day.date) === 15;
                        return (
                          <div 
                            key={`day-${monthIndex}-${dayIndex}`}
                            className={`flex-shrink-0 flex items-center justify-center text-xs border-r
                              ${day.isWeekend ? 'bg-muted/50' : ''}`}
                            style={{ width: `${dayWidth}px` }}
                          >
                            {isSpecialDay ? format(day.date, 'd') : ''}
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
              
              {/* Projektinnehåll med staplar */}
              <div>
                {projects.map((project) => {
                  const projectPhases = phases.filter(p => p.projectId === project.id);
                  
                  return (
                    <React.Fragment key={project.id}>
                      {/* Tom rad för projektrubrik */}
                      <div className="h-10 border-b relative">
                        <div className="absolute inset-0 flex">
                          {dateRange.daysInMonths.flatMap((days, monthIndex) => 
                            days.map((day, dayIndex) => (
                              <div 
                                key={`pgrid-${monthIndex}-${dayIndex}`}
                                className={`flex-shrink-0 h-full border-r
                                  ${day.isWeekend ? 'bg-muted/30' : ''}`}
                                style={{ width: `${dayWidth}px` }}
                              />
                            ))
                          )}
                        </div>
                      </div>
                      
                      {/* Fasrader med staplar */}
                      {projectPhases.map((phase) => (
                        <div key={phase.id} className="h-10 border-b relative">
                          {/* Bakgrundsrutnät */}
                          <div className="absolute inset-0 flex">
                            {dateRange.daysInMonths.flatMap((days, monthIndex) => 
                              days.map((day, dayIndex) => (
                                <div 
                                  key={`fgrid-${phase.id}-${monthIndex}-${dayIndex}`}
                                  className={`flex-shrink-0 h-full border-r
                                    ${day.isWeekend ? 'bg-muted/30' : ''}`}
                                  style={{ width: `${dayWidth}px` }}
                                />
                              ))
                            )}
                          </div>
                          
                          {/* Anpassa renderPhaseBar för att använda dagbredden */}
                          {renderPhaseBar(phase, dateRange.startDate, dateRange.endDate, dateRange.totalDays, dayWidth)}
                        </div>
                      ))}
                    </React.Fragment>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Dialog för fasdetaljer */}
      <Dialog open={isPhaseDialogOpen} onOpenChange={setIsPhaseDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          {selectedPhase && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedPhase.name}</DialogTitle>
                <DialogDescription>
                  {formatDateString(selectedPhase.startDate)} - {formatDateString(selectedPhase.endDate)}
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                <div className="space-y-1">
                  <Label>Status</Label>
                  <div className="flex gap-2">
                    <Badge variant={selectedPhase.status === 'not started' ? 'default' : 'outline'}>Ej påbörjad</Badge>
                    <Badge variant={selectedPhase.status === 'in progress' ? 'default' : 'outline'}>Pågående</Badge>
                    <Badge variant={selectedPhase.status === 'completed' ? 'default' : 'outline'}>Avslutad</Badge>
                  </div>
                </div>
                
                <div>
                  <Label className="block mb-2">Tilldelade resurser</Label>
                  {(() => {
                    // Hitta tilldelade resurser för denna fas från localAssignments-listan
                    const phaseAssignments = localAssignments.filter(assignment => 
                      String(assignment.phaseId) === String(selectedPhase.id)
                    );
                    
                    return phaseAssignments.length > 0 ? (
                      <div className="space-y-2">
                        {phaseAssignments.map(assignment => (
                          <div key={assignment.id} className="flex justify-between items-center p-2 border rounded-md">
                            <div>
                              <div className="font-medium">{assignment.resourceName}</div>
                              <div className="text-sm text-muted-foreground">
                                {assignment.hoursPerDay} timmar/dag
                              </div>
                            </div>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleRemoveAssignment(assignment.id)}
                            >
                              Ta bort
                            </Button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center text-muted-foreground p-4 border rounded-md">
                        Inga resurser tilldelade till denna fas
                      </div>
                    )
                  })()}
                </div>
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsPhaseDialogOpen(false)}>Stäng</Button>
                <Button onClick={handleEditPhase}>Redigera fas</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
      
      {/* Dialog för att redigera fas */}
      {isPhaseEditDialogOpen && selectedPhase && (
        <PhaseEditDialog
          isOpen={isPhaseEditDialogOpen}
          onClose={() => setIsPhaseEditDialogOpen(false)}
          onSave={handleSavePhase}
          onDelete={handleDeletePhase}
          phase={selectedPhase}
          editingPhase={editingPhase}
          setEditingPhase={setEditingPhase}
          handleChangeResourceHours={handleChangeResourceHours}
          handleRemoveResource={handleRemoveResource}
          handleOpenResourceDialog={handleOpenResourceDialog}
        />
      )}
      
      {/* Dialog för resurstilldelning */}
      <Dialog open={isResourceDialogOpen} onOpenChange={setIsResourceDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          {selectedResource && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedResource.name}</DialogTitle>
                <DialogDescription>
                  {selectedResource.type} · {selectedResource.availability} timmar/vecka tillgängliga
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                <div>
                  <Label className="block mb-2">Projekttilldelningar</Label>
                  {(() => {
                    // Hitta tilldelningar för denna resurs
                    const resourceAssignments = localAssignments.filter(assignment => 
                      String(assignment.resourceId) === String(selectedResource.id)
                    );
                    
                    return resourceAssignments.length > 0 ? (
                      <div className="space-y-2">
                        {resourceAssignments.map(assignment => {
                          // Hitta projektet för denna tilldelning
                          const project = projects.find(p => 
                            p.phases.some(phase => String(phase.id) === String(assignment.phaseId))
                          )
                          
                          return (
                            <div key={assignment.id} className="p-2 border rounded-md">
                              <div className="font-medium">{project?.name}</div>
                              <div className="text-sm">Fas: {assignment.phaseName}</div>
                              <div className="flex justify-between mt-1">
                                <div className="text-sm text-muted-foreground">
                                  {formatDateString(assignment.startDate)} - {formatDateString(assignment.endDate)}
                                </div>
                                <div className="text-sm font-medium">
                                  {assignment.hoursPerDay} tim/dag
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    ) : (
                      <div className="text-center text-muted-foreground p-4 border rounded-md">
                        Denna resurs har inga uppdrag tilldelade
                      </div>
                    )
                  })()}
                </div>
                
                <div className="border-t pt-4">
                  <Label className="block mb-2">Tilldelningsöversikt</Label>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Total tillgänglighet:</span>
                      <span className="font-medium">{selectedResource.availability} timmar/vecka</span>
                    </div>
                    
                    {(() => {
                      // Beräkna genomsnittlig belastning
                      const resourceAssignments = localAssignments.filter(assignment => 
                        String(assignment.resourceId) === String(selectedResource.id)
                      );
                      const totalHoursPerWeek = resourceAssignments.reduce((total, assignment) => {
                        // Förenklad beräkning: multiplicera timmar per dag med 5 arbetsdagar
                        return total + (assignment.hoursPerDay * 5)
                      }, 0)
                      
                      const utilizationPercentage = Math.min(
                        Math.round((totalHoursPerWeek / selectedResource.availability) * 100), 
                        100
                      )
                      
                      const isOverbooked = totalHoursPerWeek > selectedResource.availability
                      
                      return (
                        <>
                          <div className="flex justify-between">
                            <span>Allokerade timmar:</span>
                            <span className={`font-medium ${isOverbooked ? 'text-red-500' : ''}`}>
                              {totalHoursPerWeek} timmar/vecka
                            </span>
                          </div>
                          
                          <div>
                            <div className="flex justify-between mb-1">
                              <span>Beläggningsgrad:</span>
                              <span className={`font-medium ${isOverbooked ? 'text-red-500' : ''}`}>
                                {utilizationPercentage}%
                              </span>
                            </div>
                            
                            <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                              <div 
                                className={`h-full ${
                                  utilizationPercentage > 100 ? 'bg-red-500' : 
                                  utilizationPercentage > 90 ? 'bg-orange-500' : 
                                  'bg-green-500'
                                }`}
                                style={{ width: `${Math.min(utilizationPercentage, 100)}%` }}
                              />
                            </div>
                            
                            {isOverbooked && (
                              <div className="text-red-500 text-sm mt-1 flex items-center">
                                <AlertTriangle className="w-4 h-4 mr-1" />
                                Resursen är överbokad med {totalHoursPerWeek - selectedResource.availability} timmar/vecka
                              </div>
                            )}
                          </div>
                        </>
                      )
                    })()}
                  </div>
                </div>
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsResourceDialogOpen(false)}>Stäng</Button>
                <Button>Lägg till uppgift</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
      
      {/* Dialog för resursurvalsdialog */}
      <Dialog open={isResourceSelectionDialogOpen} onOpenChange={setIsResourceSelectionDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Välj resurs</DialogTitle>
            <DialogDescription>
              Välj en resurs att lägga till fasen
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Tillgängliga resurser</Label>
              <div className="grid gap-2">
                {availableResourcesForSelection.map(resource => (
                  <div 
                    key={resource.id} 
                    className={`flex justify-between items-center p-3 border rounded-md cursor-pointer transition-colors ${
                      selectedResourceToAdd === String(resource.id) 
                        ? 'bg-primary/10 border-primary'
                        : 'hover:bg-accent'
                    }`}
                    onClick={() => setSelectedResourceToAdd(String(resource.id))}
                  >
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="font-medium">{resource.name}</div>
                        <div className="text-sm text-muted-foreground">{resource.type}</div>
                      </div>
                    </div>
                    {selectedResourceToAdd === String(resource.id) && (
                      <CheckCircle className="h-5 w-5 text-primary" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsResourceSelectionDialogOpen(false)}>Avbryt</Button>
            <Button 
              onClick={handleAddResource}
              disabled={!selectedResourceToAdd}
              type="button"
            >
              Lägg till
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {filteredProjects.length === 0 && (
        <div className="text-center p-8">
          <div className="mb-2">
            <Calendar className="h-12 w-12 mx-auto text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium">Inga projekt hittades</h3>
          <p className="text-muted-foreground">
            {searchQuery 
              ? `Inga projekt matchade sökningen "${searchQuery}"`
              : 'Lägg till projekt i planeringen för att komma igång'
            }
          </p>
        </div>
      )}
    </div>
  )
}