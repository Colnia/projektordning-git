"use client"

import React, { useState, useEffect, useRef, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { format, differenceInDays, addDays, addMonths, startOfMonth, endOfMonth, eachDayOfInterval, isWeekend, max, min } from 'date-fns'
import { sv } from 'date-fns/locale'
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, AlertTriangle, Users, Package, Calendar, User, CheckCircle, CalendarDays } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "@/components/ui/use-toast"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"

interface Project {
  id: string | number;
  name: string;
  startDate: string;
  endDate: string;
  status: string;
  phases: Phase[];
  resources?: ResourceAssignment[];
}

interface Phase {
  id: string | number;
  name: string;
  startDate: string;
  endDate: string;
  status: string;
  projectId: string | number;
  color?: string;
  description?: string;
}

interface Resource {
  id: string | number;
  name: string;
  type: string;
  availability: number;
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

interface MaterialDelivery {
  id: string | number;
  name: string;
  description: string;
  projectId: string | number;
  phaseId: string | number;
  expectedDate: string;
  status: 'pending' | 'in transit' | 'delivered' | 'delayed';
  supplier: string;
  quantity: number;
  unit: string;
}

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;
  
  const [project, setProject] = useState<Project | null>(null);
  const [resources, setResources] = useState<Resource[]>([]);
  const [assignments, setAssignments] = useState<ResourceAssignment[]>([]);
  const [materialDeliveries, setMaterialDeliveries] = useState<MaterialDelivery[]>([]);
  const [conflicts, setConflicts] = useState<string[]>([]);
  const [viewMonths, setViewMonths] = useState<number>(3);
  const [startDate, setStartDate] = useState<Date>(startOfMonth(new Date()));
  const [loading, setLoading] = useState<boolean>(true);
  
  // State för redigering
  const [selectedPhase, setSelectedPhase] = useState<Phase | null>(null);
  const [isPhaseDialogOpen, setIsPhaseDialogOpen] = useState(false);
  const [editingPhase, setEditingPhase] = useState<{
    id: string | number;
    name: string;
    startDate: Date;
    endDate: Date;
    status: string;
    description: string;
    color: string;
  } | null>(null);
  
  // State för resurshantering
  const [isResourceDialogOpen, setIsResourceDialogOpen] = useState(false);
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null);
  const [phaseResources, setPhaseResources] = useState<ResourceAssignment[]>([]);
  
  // State för materialleveranser
  const [isDeliveryDialogOpen, setIsDeliveryDialogOpen] = useState(false);
  const [editingDelivery, setEditingDelivery] = useState<MaterialDelivery | null>(null);
  
  // Beräkna datumintervall för Gantt-schemat
  const endDate = endOfMonth(addMonths(startDate, viewMonths - 1));
  const dateHeaders = Array.from({ length: viewMonths }, (_, i) => addMonths(startDate, i));
  
  const daysInMonths = dateHeaders.map(date => {
    const monthStart = startOfMonth(date);
    const monthEnd = endOfMonth(date);
    return eachDayOfInterval({ start: monthStart, end: monthEnd }).map(day => ({
      date: day,
      isWeekend: isWeekend(day)
    }));
  });
  
  // Centraliserad datumberäkning för Gantt-schemat
  const calculateDateRange = () => {
    const start = startDate;
    const end = endOfMonth(addMonths(start, viewMonths - 1));
    
    // Beräkna totalt antal dagar i vyn
    const totalDays = differenceInDays(end, start) + 1;
    
    return {
      startDate: start,
      endDate: end,
      totalDays: totalDays,
      dateHeaders: dateHeaders,
      daysInMonths: daysInMonths
    };
  };
  
  // Använd den centraliserade datumberäkningen med useMemo för att säkerställa omberäkning när viewMonths ändras
  const dateRange = useMemo(() => calculateDateRange(), [startDate, viewMonths, dateHeaders, daysInMonths]);
  
  // Hämta projektdetaljer
  useEffect(() => {
    async function fetchProjectData() {
      try {
        setLoading(true);
        // Hämta projektdata
        const response = await fetch(`/api/planning`);
        const data = await response.json();
        
        // Hitta det specifika projektet
        const foundProject = data.projects.find((p: Project) => String(p.id) === String(projectId));
        if (!foundProject) {
          console.error('Projekt hittades inte');
          return;
        }
        
        setProject(foundProject);
        setResources(data.resources);
        setAssignments(data.assignments);
        
        // Simulera materialleveranser för demo (dessa skulle hämtas från en API i produktion)
        const demoMaterialDeliveries: MaterialDelivery[] = [
          {
            id: 1,
            name: 'Byggmaterial A',
            description: 'Grundläggande byggmaterial',
            projectId: projectId,
            phaseId: foundProject.phases[0].id,
            expectedDate: addDays(new Date(foundProject.startDate), 14).toISOString().split('T')[0],
            status: 'pending',
            supplier: 'Leverantör AB',
            quantity: 100,
            unit: 'st'
          },
          {
            id: 2,
            name: 'Specialverktyg',
            description: 'Specialverktyg för montering',
            projectId: projectId,
            phaseId: foundProject.phases[0].id,
            expectedDate: addDays(new Date(foundProject.phases[0].startDate), 5).toISOString().split('T')[0],
            status: 'in transit',
            supplier: 'Verktyg & Co',
            quantity: 5,
            unit: 'set'
          }
        ];
        
        setMaterialDeliveries(demoMaterialDeliveries);
        
        // Identifiera resurskonflikter
        findResourceConflicts(data.assignments);
      } catch (error) {
        console.error('Fel vid hämtning av projektdata:', error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchProjectData();
  }, [projectId]);
  
  // Hitta resurskonflikter
  const findResourceConflicts = (allAssignments: ResourceAssignment[]) => {
    const conflictingResources: string[] = [];
    
    // Gruppera tilldelningar efter resurs-ID
    const resourceAssignments: Record<string, ResourceAssignment[]> = {};
    
    allAssignments.forEach(assignment => {
      const resourceId = String(assignment.resourceId);
      if (!resourceAssignments[resourceId]) {
        resourceAssignments[resourceId] = [];
      }
      resourceAssignments[resourceId].push(assignment);
    });
    
    // Kontrollera överlappningar för varje resurs
    Object.entries(resourceAssignments).forEach(([resourceId, assignments]) => {
      if (assignments.length < 2) return;
      
      // Sortera tilldelningar efter startdatum
      assignments.sort((a, b) => 
        new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
      );
      
      // Kontrollera om det finns överlappningar
      for (let i = 0; i < assignments.length - 1; i++) {
        const currentEnd = new Date(assignments[i].endDate);
        const nextStart = new Date(assignments[i + 1].startDate);
        
        if (currentEnd >= nextStart) {
          // Överlappning hittad
          conflictingResources.push(resourceId);
          break;
        }
      }
    });
    
    setConflicts(conflictingResources);
  };
  
  // Hjälpfunktion för att beräkna stapelposition
  const calculateBarPosition = (startDateStr: string, endDateStr: string) => {
    const barStartDate = new Date(startDateStr);
    const barEndDate = new Date(endDateStr);
    
    // Använd dateRange för att få datum från den centraliserade beräkningen
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
      };
    }
    
    // Beräkna relativ position från början av diagrammet
    const startOffset = differenceInDays(
      barStartDate >= firstDayOfChart ? barStartDate : firstDayOfChart,
      firstDayOfChart
    );
    
    // Beräkna stapelns synliga längd
    const visibleEndDate = barEndDate <= lastDayOfChart ? barEndDate : lastDayOfChart;
    const visibleStartDate = barStartDate >= firstDayOfChart ? barStartDate : firstDayOfChart;
    const barLength = differenceInDays(visibleEndDate, visibleStartDate) + 1;
    
    // Beräkna procentuell position och bredd
    const leftPercent = (startOffset / totalDaysInView) * 100;
    const widthPercent = (barLength / totalDaysInView) * 100;
    
    return {
      left: leftPercent,
      width: widthPercent,
      isVisible: true
    };
  };
  
  // Hantera navigering mellan månader
  const handlePreviousMonth = () => {
    setStartDate(prevDate => addMonths(prevDate, -1));
  };
  
  const handleNextMonth = () => {
    setStartDate(prevDate => addMonths(prevDate, 1));
  };
  
  const handleGoToToday = () => {
    setStartDate(startOfMonth(new Date()));
  };
  
  // Fasfunktioner
  const handlePhaseClick = (phase: Phase) => {
    setSelectedPhase(phase);
    
    // Hitta alla resurstilldelningar för denna fas
    const phaseAssignments = assignments.filter(assignment => 
      String(assignment.phaseId) === String(phase.id)
    );
    
    setPhaseResources(phaseAssignments);
  };
  
  const handleEditPhase = () => {
    if (!selectedPhase) return;
    
    setEditingPhase({
      id: selectedPhase.id,
      name: selectedPhase.name,
      startDate: new Date(selectedPhase.startDate),
      endDate: new Date(selectedPhase.endDate),
      status: selectedPhase.status,
      description: selectedPhase.description || '',
      color: selectedPhase.color || '',
    });
    
    setIsPhaseDialogOpen(true);
  };
  
  const handleSavePhase = async () => {
    if (!editingPhase || !selectedPhase) return;
    
    try {
      const updatedPhase = {
        id: selectedPhase.id,
        name: editingPhase.name,
        startDate: format(editingPhase.startDate, 'yyyy-MM-dd'),
        endDate: format(editingPhase.endDate, 'yyyy-MM-dd'),
        status: editingPhase.status,
        projectId: selectedPhase.projectId,
        color: editingPhase.color
      };
      
      const response = await fetch('/api/planning/phases', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedPhase)
      });
      
      if (response.ok) {
        // Uppdatera lokalt project state med de uppdaterade faserna
        if (project) {
          const updatedPhases = project.phases.map(p => 
            String(p.id) === String(selectedPhase.id) ? { ...p, ...updatedPhase } : p
          );
          
          setProject({ ...project, phases: updatedPhases });
          
          // Uppdatera selectedPhase
          setSelectedPhase({ ...selectedPhase, ...updatedPhase });
        }
        
        setIsPhaseDialogOpen(false);
        toast({ title: "Fasen har uppdaterats" });
      } else {
        throw new Error('Kunde inte uppdatera fasen');
      }
    } catch (error) {
      console.error('Fel vid uppdatering av fas:', error);
      toast({ 
        title: "Ett fel uppstod", 
        description: "Kunde inte uppdatera fasen", 
        variant: "destructive" 
      });
    }
  };
  
  // Resurshantering
  const handleAddResource = () => {
    if (!selectedPhase) return;
    setIsResourceDialogOpen(true);
  };
  
  const handleSelectResource = async (resourceId: string, hoursPerDay: number = 8) => {
    if (!selectedPhase || !project) return;
    
    try {
      const resourceToAdd = resources.find(r => String(r.id) === String(resourceId));
      if (!resourceToAdd) return;
      
      const newAssignment = {
        resourceId: resourceId,
        projectId: project.id,
        phaseId: selectedPhase.id,
        startDate: selectedPhase.startDate,
        endDate: selectedPhase.endDate,
        hoursPerDay: hoursPerDay
      };
      
      const response = await fetch('/api/planning', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          type: 'assignment',
          assignment: newAssignment
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        
        // Lägg till den nya tilldelningen i state
        const newAssignmentWithName = {
          ...result.assignment,
          resourceName: resourceToAdd.name,
          phaseName: selectedPhase.name
        };
        
        setAssignments(prev => [...prev, newAssignmentWithName]);
        setPhaseResources(prev => [...prev, newAssignmentWithName]);
        
        setIsResourceDialogOpen(false);
        toast({ title: "Resurs tilldelad" });
        
        // Uppdatera konflikter
        findResourceConflicts([...assignments, newAssignmentWithName]);
      } else {
        throw new Error('Kunde inte tilldela resursen');
      }
    } catch (error) {
      console.error('Fel vid resurstilldelning:', error);
      toast({ 
        title: "Ett fel uppstod", 
        description: "Kunde inte tilldela resursen", 
        variant: "destructive" 
      });
    }
  };
  
  const handleRemoveResource = async (assignmentId: string | number) => {
    try {
      const response = await fetch(`/api/planning/assignments/delete?id=${assignmentId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        // Ta bort tilldelningen från state
        setAssignments(prev => prev.filter(a => String(a.id) !== String(assignmentId)));
        setPhaseResources(prev => prev.filter(a => String(a.id) !== String(assignmentId)));
        
        toast({ title: "Resurs borttagen" });
        
        // Uppdatera konflikter
        findResourceConflicts(assignments.filter(a => String(a.id) !== String(assignmentId)));
      } else {
        throw new Error('Kunde inte ta bort resursen');
      }
    } catch (error) {
      console.error('Fel vid borttagning av resurs:', error);
      toast({ 
        title: "Ett fel uppstod", 
        description: "Kunde inte ta bort resursen", 
        variant: "destructive" 
      });
    }
  };
  
  // Materialleveranser
  const handleAddDelivery = () => {
    if (!selectedPhase || !project) return;
    
    setEditingDelivery({
      id: 'new',
      name: '',
      description: '',
      projectId: project.id,
      phaseId: selectedPhase.id,
      expectedDate: addDays(new Date(selectedPhase.startDate), 3).toISOString().split('T')[0],
      status: 'pending',
      supplier: '',
      quantity: 1,
      unit: 'st'
    });
    
    setIsDeliveryDialogOpen(true);
  };
  
  const handleSaveDelivery = async () => {
    if (!editingDelivery) return;
    
    try {
      // I en verklig implementation skulle detta anropa ett backend-API
      // För demo-syften simulerar vi det här med lokal state
      
      let updatedDelivery: MaterialDelivery;
      
      if (editingDelivery.id === 'new') {
        // Skapa ny leverans
        updatedDelivery = {
          ...editingDelivery,
          id: `delivery-${Date.now()}`
        };
        
        setMaterialDeliveries(prev => [...prev, updatedDelivery]);
      } else {
        // Uppdatera befintlig leverans
        updatedDelivery = editingDelivery;
        setMaterialDeliveries(prev => 
          prev.map(d => d.id === editingDelivery.id ? editingDelivery : d)
        );
      }
      
      setIsDeliveryDialogOpen(false);
      toast({ title: "Materialleverans sparad" });
      
      // Uppdatera vyn direkt
      if (selectedPhase) {
        handlePhaseClick(selectedPhase);
      }
    } catch (error) {
      console.error('Fel vid sparande av materialleverans:', error);
      toast({ 
        title: "Ett fel uppstod", 
        description: "Kunde inte spara materialleveransen", 
        variant: "destructive" 
      });
    }
  };
  
  const handleRemoveDelivery = (deliveryId: string | number) => {
    try {
      // Ta bort leverans från lokal state
      setMaterialDeliveries(prev => prev.filter(d => d.id !== deliveryId));
      toast({ title: "Materialleverans borttagen" });
      
      // Uppdatera vyn direkt
      if (selectedPhase) {
        handlePhaseClick(selectedPhase);
      }
    } catch (error) {
      console.error('Fel vid borttagning av materialleverans:', error);
      toast({ 
        title: "Ett fel uppstod", 
        description: "Kunde inte ta bort materialleveransen", 
        variant: "destructive" 
      });
    }
  };
  
  if (loading || !project) {
    return (
      <div className="container mx-auto p-4">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-slate-200 rounded-md w-1/3"></div>
          <div className="h-64 bg-slate-200 rounded-md"></div>
          <div className="h-32 bg-slate-200 rounded-md"></div>
          <div className="h-32 bg-slate-200 rounded-md"></div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <div>
          <Button variant="outline" onClick={() => router.back()} className="mb-2">
            <ChevronLeft className="w-4 h-4 mr-1" /> Tillbaka
          </Button>
          <h1 className="text-2xl font-bold">{project.name} - Detaljerad planering</h1>
          <p className="text-muted-foreground">
            Period: {format(new Date(project.startDate), 'd MMM yyyy', { locale: sv })} - 
            {format(new Date(project.endDate), 'd MMM yyyy', { locale: sv })}
          </p>
        </div>
        
        <div className="flex gap-2">
          <Select 
            value={String(viewMonths)} 
            onValueChange={(value) => {
              const newViewMonths = Number(value);
              setViewMonths(newViewMonths);
              console.log(`Ändrade visningsperiod till ${newViewMonths} månader`);
            }}
          >
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">1 månad</SelectItem>
              <SelectItem value="2">2 månader</SelectItem>
              <SelectItem value="3">3 månader</SelectItem>
              <SelectItem value="6">6 månader</SelectItem>
              <SelectItem value="12">12 månader</SelectItem>
            </SelectContent>
          </Select>
          
          <div className="flex">
            <Button variant="outline" size="icon" onClick={handlePreviousMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" onClick={handleGoToToday} className="h-9 px-2 text-xs">
              Idag
            </Button>
            <Button variant="outline" size="icon" onClick={handleNextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
      
      <Tabs defaultValue="gantt" className="space-y-4">
        <TabsList className="grid grid-cols-3 w-[400px]">
          <TabsTrigger value="gantt">Gantt-schema</TabsTrigger>
          <TabsTrigger value="resources">Resurser</TabsTrigger>
          <TabsTrigger value="materials">Material</TabsTrigger>
        </TabsList>
        
        <TabsContent value="gantt" className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Detaljerad tidslinje</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="border rounded-md" style={{ overflow: 'hidden' }}>
                <div className="grid grid-cols-[200px_1fr]">
                  {/* Rubrikområde */}
                  <div className="bg-muted p-2 border-b font-medium">Faser</div>
                  <div className="bg-muted border-b">
                    <div className="flex">
                      {daysInMonths.map((daysInMonth, monthIndex) => (
                        <div key={`month-${monthIndex}`} className="flex flex-col">
                          <div className="h-8 border-b flex items-center justify-center px-2 font-medium">
                            {format(dateRange.dateHeaders[monthIndex], 'MMMM yyyy', { locale: sv })}
                          </div>
                          <div className="flex">
                            {daysInMonth.map((day, dayIndex) => (
                              <div 
                                key={`day-${monthIndex}-${dayIndex}`} 
                                className={`w-[20px] h-6 flex items-center justify-center text-xs ${
                                  day.isWeekend ? 'bg-muted-foreground/10' : ''
                                }`}
                              >
                                {dayIndex + 1}
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Innehållsområde - strikt uppdelat i namn och diagram */}
                  <div className="max-h-[400px] border-r border-gray-200">
                    <ScrollArea>
                      {project.phases.map(phase => (
                        <div 
                          key={`phase-name-${phase.id}`} 
                          className={`p-2 border-b text-sm hover:bg-accent/10 cursor-pointer ${
                            selectedPhase?.id === phase.id ? 'bg-accent/20' : ''
                          }`}
                          onClick={() => handlePhaseClick(phase)}
                        >
                          {phase.name}
                        </div>
                      ))}
                    </ScrollArea>
                  </div>
                  
                  {/* Gantt-schema-området - endast staplar */}
                  <div className="relative overflow-auto">
                    <div style={{ height: project.phases.length * 33 }}>
                      {/* Bakgrundsrutnät för dagar */}
                      <div className="absolute inset-0 z-0">
                        <div className="flex">
                          {daysInMonths.map((daysInMonth, monthIndex) => (
                            <div key={`grid-month-${monthIndex}`} className="flex">
                              {daysInMonth.map((day, dayIndex) => (
                                <div 
                                  key={`grid-day-${monthIndex}-${dayIndex}`} 
                                  className={`w-[20px] h-full border-r ${
                                    day.isWeekend ? 'bg-muted-foreground/10' : ''
                                  }`}
                                />
                              ))}
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      {/* Projektfaser med staplar */}
                      {project.phases.map((phase, phaseIndex) => {
                        const { left, width, isVisible } = calculateBarPosition(phase.startDate, phase.endDate);
                        
                        // Hoppa över rendering om stapeln inte är synlig i aktuell vy
                        if (!isVisible) return null;
                        
                        // Resurser tilldelade till denna fas
                        const phaseResources = assignments.filter(r => 
                          String(r.phaseId) === String(phase.id)
                        );
                        
                        // Materialleveranser för denna fas
                        const phaseMaterials = materialDeliveries.filter(m => 
                          String(m.phaseId) === String(phase.id)
                        );
                        
                        return (
                          <TooltipProvider key={`phase-bar-${phase.id}`}>
                            <Tooltip>
                              <TooltipTrigger>
                                <div 
                                  className={`absolute h-7 rounded-md shadow-sm hover:shadow-md transition-shadow cursor-pointer 
                                    ${!phase.color ? 
                                      phase.status === 'completed' ? 'bg-green-500' : 
                                      phase.status === 'in progress' ? 'bg-blue-500' : 
                                      'bg-orange-300' : ''}`}
                                  style={{
                                    top: phaseIndex * 33 + 10,
                                    left: `${left}%`, 
                                    width: `${width}%`,
                                    backgroundColor: phase.color || '',
                                    zIndex: 20
                                  }}
                                  onClick={() => handlePhaseClick(phase)}
                                >
                                  {width > 5 && (
                                    <div className="px-2 py-0.5 text-white text-xs font-medium truncate flex items-center">
                                      <span className="truncate">{phase.name}</span>
                                      {width > 15 && (
                                        <span className="ml-1 opacity-70 text-[0.65rem]">
                                          ({format(new Date(phase.startDate), 'd MMM', { locale: sv })}-{format(new Date(phase.endDate), 'd MMM', { locale: sv })})
                                        </span>
                                      )}
                                    </div>
                                  )}
                                  
                                  {/* Visa resurssymboler om det finns tilldelade resurser */}
                                  {phaseResources.length > 0 && width > 8 && (
                                    <div 
                                      className="absolute right-1 top-0 bottom-0 flex items-center"
                                      style={{ marginTop: '-1px' }}
                                    >
                                      <Badge variant="outline" className="bg-white/20 h-5">
                                        <Users className="w-3 h-3 mr-1" />
                                        {phaseResources.length}
                                      </Badge>
                                    </div>
                                  )}
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>
                                <div className="space-y-1">
                                  <p className="font-bold">{phase.name}</p>
                                  <p>{format(new Date(phase.startDate), 'd MMM yyyy', { locale: sv })} - {format(new Date(phase.endDate), 'd MMM yyyy', { locale: sv })}</p>
                                  <p>Status: {phase.status}</p>
                                  {phaseResources.length > 0 && (
                                    <>
                                      <p className="font-medium mt-1">Resurser:</p>
                                      <ul className="list-disc pl-4">
                                        {phaseResources.map((resource, idx) => (
                                          <li key={`${phase.id}-${resource.id}-${idx}`}>{resource.resourceName}</li>
                                        ))}
                                      </ul>
                                    </>
                                  )}
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        );
                      })}
                      
                      {/* Visa materialleveranser som punkter på tidslinjen */}
                      {materialDeliveries.map((material) => {
                        const { left, isVisible } = calculateBarPosition(material.expectedDate, material.expectedDate);
                        if (!isVisible) return null;
                        
                        const phaseIndex = project.phases.findIndex(p => String(p.id) === String(material.phaseId));
                        if (phaseIndex === -1) return null;
                        
                        // Bestäm färg baserat på status
                        const materialColor = material.status === 'delivered' ? 'bg-green-500' : 
                                            material.status === 'in transit' ? 'bg-blue-400' : 
                                            material.status === 'delayed' ? 'bg-red-500' : 'bg-amber-400';
                        
                        return (
                          <TooltipProvider key={`material-${material.id}`}>
                            <Tooltip>
                              <TooltipTrigger>
                                <div 
                                  className={`absolute w-5 h-5 ${materialColor} rounded-full shadow-sm flex items-center justify-center cursor-pointer z-30`}
                                  style={{ 
                                    top: phaseIndex * 33 + 6,
                                    left: `calc(${left}% - 8px)`
                                  }}
                                >
                                  <Package className="w-3 h-3 text-white" />
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>
                                <div className="space-y-1">
                                  <p className="font-bold">{material.name}</p>
                                  <p>{material.description}</p>
                                  <p>Leverans: {format(new Date(material.expectedDate), 'd MMM yyyy', { locale: sv })}</p>
                                  <p>Status: {
                                    material.status === 'pending' ? 'Väntande' :
                                    material.status === 'in transit' ? 'Under transport' :
                                    material.status === 'delivered' ? 'Levererad' : 'Försenad'
                                  }</p>
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Fasinformation och åtgärder */}
              {selectedPhase && (
                <div className="mt-6 space-y-4 border rounded-md p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-medium">{selectedPhase.name}</h3>
                      <p className="text-muted-foreground">
                        {format(new Date(selectedPhase.startDate), 'd MMM yyyy', { locale: sv })} - 
                        {format(new Date(selectedPhase.endDate), 'd MMM yyyy', { locale: sv })}
                      </p>
                      <p>{selectedPhase.description}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={handleEditPhase}>
                        Redigera fas
                      </Button>
                      <Button size="sm" onClick={handleAddResource}>
                        Lägg till resurs
                      </Button>
                      <Button size="sm" variant="secondary" onClick={handleAddDelivery}>
                        <Package className="w-4 h-4 mr-1" />
                        Lägg till material
                      </Button>
                    </div>
                  </div>
                  
                  {/* Resurstilldelningar */}
                  {phaseResources.length > 0 && (
                    <div className="mt-4">
                      <h4 className="text-sm font-medium mb-2">Tilldelade resurser</h4>
                      <div className="border rounded-md overflow-hidden">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-muted">
                            <tr>
                              <th className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider">Namn</th>
                              <th className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider">Timmar/dag</th>
                              <th className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider">Period</th>
                              <th className="px-3 py-2 text-right text-xs font-medium uppercase tracking-wider">Åtgärder</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {phaseResources.map((resource) => (
                              <tr key={resource.id} className={conflicts.includes(String(resource.resourceId)) ? 'bg-red-50' : ''}>
                                <td className="px-3 py-2 whitespace-nowrap">
                                  <div className="flex items-center">
                                    <User className="w-4 h-4 mr-2" />
                                    <span className="text-sm">{resource.resourceName}</span>
                                    {conflicts.includes(String(resource.resourceId)) && (
                                      <AlertTriangle className="w-4 h-4 ml-2 text-red-500" />
                                    )}
                                  </div>
                                </td>
                                <td className="px-3 py-2 whitespace-nowrap text-sm">{resource.hoursPerDay}</td>
                                <td className="px-3 py-2 whitespace-nowrap text-sm">
                                  {format(new Date(resource.startDate), 'd MMM', { locale: sv })} - 
                                  {format(new Date(resource.endDate), 'd MMM', { locale: sv })}
                                </td>
                                <td className="px-3 py-2 whitespace-nowrap text-right text-sm">
                                  <Button variant="ghost" size="sm" onClick={() => handleRemoveResource(resource.id)}>
                                    Ta bort
                                  </Button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                  
                  {/* Material för denna fas */}
                  {materialDeliveries.filter(m => String(m.phaseId) === String(selectedPhase.id)).length > 0 && (
                    <div className="mt-4">
                      <h4 className="text-sm font-medium mb-2">Material och leveranser</h4>
                      <div className="border rounded-md overflow-hidden">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-muted">
                            <tr>
                              <th className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider">Material</th>
                              <th className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider">Leverantör</th>
                              <th className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider">Datum</th>
                              <th className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider">Status</th>
                              <th className="px-3 py-2 text-right text-xs font-medium uppercase tracking-wider">Åtgärder</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {materialDeliveries
                              .filter(m => String(m.phaseId) === String(selectedPhase.id))
                              .sort((a, b) => new Date(a.expectedDate).getTime() - new Date(b.expectedDate).getTime())
                              .map((material) => {
                                const statusColors = {
                                  'pending': 'bg-blue-100 text-blue-800',
                                  'in transit': 'bg-yellow-100 text-yellow-800',
                                  'delivered': 'bg-green-100 text-green-800',
                                  'delayed': 'bg-red-100 text-red-800'
                                };
                                
                                const statusLabels = {
                                  'pending': 'Väntande',
                                  'in transit': 'Under transport',
                                  'delivered': 'Levererad',
                                  'delayed': 'Försenad'
                                };
                                
                                const today = new Date();
                                const expectedDate = new Date(material.expectedDate);
                                const isOverdue = material.status !== 'delivered' && expectedDate < today;
                                
                                return (
                                  <tr key={material.id} className={isOverdue ? 'bg-red-50' : ''}>
                                    <td className="px-3 py-2 whitespace-nowrap">
                                      <div className="text-sm font-medium flex items-center">
                                        <Package className="w-4 h-4 mr-2 text-gray-500" />
                                        {material.name}
                                      </div>
                                      <div className="text-xs text-gray-500">{material.description}</div>
                                      <div className="text-xs text-gray-500">{material.quantity} {material.unit}</div>
                                    </td>
                                    <td className="px-3 py-2 whitespace-nowrap text-sm">{material.supplier}</td>
                                    <td className="px-3 py-2 whitespace-nowrap text-sm">
                                      <div className={isOverdue ? 'text-red-700 font-medium' : ''}>
                                        {format(expectedDate, 'd MMM yyyy', { locale: sv })}
                                        {isOverdue && (
                                          <div className="text-xs font-normal">Försenad!</div>
                                        )}
                                      </div>
                                    </td>
                                    <td className="px-3 py-2 whitespace-nowrap">
                                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColors[material.status]}`}>
                                        {statusLabels[material.status]}
                                      </span>
                                    </td>
                                    <td className="px-3 py-2 whitespace-nowrap text-right text-sm">
                                      <Button 
                                        variant="ghost" 
                                        size="sm" 
                                        onClick={() => {
                                          setEditingDelivery(material);
                                          setIsDeliveryDialogOpen(true);
                                        }}
                                      >
                                        Redigera
                                      </Button>
                                      <Button 
                                        variant="ghost" 
                                        size="sm" 
                                        className="text-red-600 hover:text-red-800"
                                        onClick={() => handleRemoveDelivery(material.id)}
                                      >
                                        Ta bort
                                      </Button>
                                    </td>
                                  </tr>
                                );
                              })}
                          </tbody>
                        </table>
                      </div>
                      {materialDeliveries.filter(m => String(m.phaseId) === String(selectedPhase.id)).length === 0 && (
                        <div className="text-center p-4 text-gray-500">
                          Inga materialleveranser har lagts till för denna fas.
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="resources" className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Resursallokering</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="border rounded-md p-4">
                <div className="space-y-6">
                  {resources.map(resource => {
                    const resourceAssignments = assignments.filter(
                      a => String(a.resourceId) === String(resource.id) && String(a.projectId) === String(projectId)
                    );
                    
                    const hasConflict = conflicts.includes(String(resource.id));
                    
                    if (resourceAssignments.length === 0) return null;
                    
                    return (
                      <div key={resource.id} className="space-y-2">
                        <div className="flex items-center">
                          <h3 className="text-lg font-medium flex items-center">
                            {resource.name}
                            {hasConflict && (
                              <Badge variant="destructive" className="ml-2">
                                <AlertTriangle className="w-3 h-3 mr-1" />
                                Resurskonflikt
                              </Badge>
                            )}
                          </h3>
                        </div>
                        
                        <div className="relative h-10 bg-slate-100 rounded-md mt-1">
                          {resourceAssignments.map((assignment, idx) => {
                            const { left, width, isVisible } = calculateBarPosition(assignment.startDate, assignment.endDate);
                            
                            // Hoppa över rendering om tilldelningen inte är synlig i aktuell vy
                            if (!isVisible) return null;
                            
                            return (
                              <TooltipProvider key={`assignment-${assignment.id}`}>
                                <Tooltip>
                                  <TooltipTrigger>
                                    <div 
                                      className="absolute h-6 rounded-sm top-2 bg-blue-500"
                                      style={{ 
                                        left: `${left}%`, 
                                        width: `${width}%` 
                                      }}
                                    >
                                      {width > 10 && (
                                        <div className="px-2 text-white text-xs truncate">
                                          {assignment.phaseName}
                                        </div>
                                      )}
                                    </div>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <div className="space-y-1">
                                      <p className="font-medium">{assignment.phaseName}</p>
                                      <p className="text-xs">
                                        {format(new Date(assignment.startDate), 'd MMM yyyy', { locale: sv })} - 
                                        {format(new Date(assignment.endDate), 'd MMM yyyy', { locale: sv })}
                                      </p>
                                      <p className="text-xs">{assignment.hoursPerDay} timmar/dag</p>
                                    </div>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="materials" className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Materialleveranser</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-muted">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Material</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Fas</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Leverantör</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Förväntat datum</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {materialDeliveries.map((material) => {
                      const phase = project.phases.find(p => String(p.id) === String(material.phaseId));
                      
                      const statusColors = {
                        'pending': 'bg-blue-100 text-blue-800',
                        'in transit': 'bg-yellow-100 text-yellow-800',
                        'delivered': 'bg-green-100 text-green-800',
                        'delayed': 'bg-red-100 text-red-800'
                      };
                      
                      return (
                        <tr key={material.id} className="hover:bg-muted/50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            {material.name}
                            <div className="text-xs text-muted-foreground">{material.description}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            {phase?.name || 'Okänd fas'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            {material.supplier}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            {format(new Date(material.expectedDate), 'd MMM yyyy', { locale: sv })}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColors[material.status]}`}>
                              {material.status === 'pending' && 'Väntande'}
                              {material.status === 'in transit' && 'Under transport'}
                              {material.status === 'delivered' && 'Levererad'}
                              {material.status === 'delayed' && 'Försenad'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                    
                    {materialDeliveries.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-6 py-4 whitespace-nowrap text-sm text-center text-muted-foreground">
                          Inga materialleveranser planerade för detta projekt.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Fasredigeringsdialog */}
      <Dialog open={isPhaseDialogOpen} onOpenChange={setIsPhaseDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          {editingPhase && (
            <>
              <DialogHeader>
                <DialogTitle>Redigera fas</DialogTitle>
                <DialogDescription>
                  Uppdatera information om denna fas
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name" className="text-right">
                    Namn
                  </Label>
                  <Input
                    id="name"
                    value={editingPhase.name}
                    onChange={(e) => setEditingPhase({ ...editingPhase, name: e.target.value })}
                    className="col-span-3"
                  />
                </div>
                
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right">Datum</Label>
                  <div className="col-span-3 flex flex-wrap md:flex-nowrap gap-3">
                    <div className="w-full md:w-1/2">
                      <Label htmlFor="startDate" className="text-xs text-muted-foreground">
                        Startdatum
                      </Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-full justify-start text-left font-normal mt-1"
                          >
                            <CalendarDays className="mr-2 h-4 w-4" />
                            {format(editingPhase.startDate, 'd MMM yyyy', { locale: sv })}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <CalendarComponent
                            mode="single"
                            selected={editingPhase.startDate}
                            onSelect={(date) => date && setEditingPhase({ ...editingPhase, startDate: date })}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    
                    <div className="w-full md:w-1/2">
                      <Label htmlFor="endDate" className="text-xs text-muted-foreground">
                        Slutdatum
                      </Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-full justify-start text-left font-normal mt-1"
                          >
                            <CalendarDays className="mr-2 h-4 w-4" />
                            {format(editingPhase.endDate, 'd MMM yyyy', { locale: sv })}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <CalendarComponent
                            mode="single"
                            selected={editingPhase.endDate}
                            onSelect={(date) => date && setEditingPhase({ ...editingPhase, endDate: date })}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="status" className="text-right">
                    Status
                  </Label>
                  <Select 
                    value={editingPhase.status}
                    onValueChange={(value) => setEditingPhase({ ...editingPhase, status: value })}
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Välj status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="not started">Ej påbörjad</SelectItem>
                      <SelectItem value="in progress">Pågående</SelectItem>
                      <SelectItem value="completed">Avslutad</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="description" className="text-right">
                    Beskrivning
                  </Label>
                  <Textarea
                    id="description"
                    value={editingPhase.description}
                    onChange={(e) => setEditingPhase({ ...editingPhase, description: e.target.value })}
                    className="col-span-3"
                    placeholder="Beskrivning av fasen..."
                    rows={3}
                  />
                </div>
                
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="color" className="text-right">
                    Färg
                  </Label>
                  <div className="col-span-3">
                    <div className="flex gap-1 flex-wrap">
                      {['#4285F4', '#EA4335', '#FBBC05', '#34A853', '#8A2BE2', '#FF7F50', '#6495ED', '#3CB371'].map((c) => (
                        <div 
                          key={c}
                          className={`w-6 h-6 rounded-full cursor-pointer border-2 ${editingPhase.color === c ? 'border-black' : 'border-transparent'}`}
                          style={{ backgroundColor: c }}
                          onClick={() => setEditingPhase({ ...editingPhase, color: c })}
                        />
                      ))}
                      <div 
                        className={`w-6 h-6 rounded-full cursor-pointer border-2 ${!editingPhase.color ? 'border-black' : 'border-transparent'} bg-gray-200 flex items-center justify-center`}
                        onClick={() => setEditingPhase({ ...editingPhase, color: '' })}
                      >
                        <span className="text-xs">X</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsPhaseDialogOpen(false)}>
                  Avbryt
                </Button>
                <Button onClick={handleSavePhase}>Spara ändringar</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
      
      {/* Dialog för resurstilldelning */}
      <Dialog open={isResourceDialogOpen} onOpenChange={setIsResourceDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Lägg till resurs</DialogTitle>
            <DialogDescription>
              Tilldela en resurs till fasen {selectedPhase?.name}
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="resource" className="text-right">
                Välj resurs
              </Label>
              <Select onValueChange={(value) => handleSelectResource(value)}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Välj resurs" />
                </SelectTrigger>
                <SelectContent>
                  {resources.map(resource => (
                    <SelectItem key={resource.id} value={String(resource.id)}>
                      {resource.name} ({resource.type})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsResourceDialogOpen(false)}>
              Avbryt
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Dialog för materialleveranser */}
      <Dialog open={isDeliveryDialogOpen} onOpenChange={setIsDeliveryDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          {editingDelivery && (
            <>
              <DialogHeader>
                <DialogTitle>
                  {editingDelivery.id === 'new' ? 'Lägg till materialleverans' : 'Redigera materialleverans'}
                </DialogTitle>
                <DialogDescription>
                  {editingDelivery.id === 'new' 
                    ? 'Lägg till en ny materialleverans för fasen' 
                    : 'Redigera information om materialleveransen'}
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="materialName" className="text-right">
                    Materialnamn
                  </Label>
                  <Input
                    id="materialName"
                    value={editingDelivery.name}
                    onChange={(e) => setEditingDelivery({ ...editingDelivery, name: e.target.value })}
                    className="col-span-3"
                  />
                </div>
                
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="description" className="text-right">
                    Beskrivning
                  </Label>
                  <Textarea
                    id="description"
                    value={editingDelivery.description}
                    onChange={(e) => setEditingDelivery({ ...editingDelivery, description: e.target.value })}
                    className="col-span-3"
                    rows={2}
                  />
                </div>
                
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="supplier" className="text-right">
                    Leverantör
                  </Label>
                  <Input
                    id="supplier"
                    value={editingDelivery.supplier}
                    onChange={(e) => setEditingDelivery({ ...editingDelivery, supplier: e.target.value })}
                    className="col-span-3"
                  />
                </div>
                
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="expectedDate" className="text-right">
                    Leveransdatum
                  </Label>
                  <div className="col-span-3">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left font-normal"
                        >
                          <CalendarDays className="mr-2 h-4 w-4" />
                          {format(new Date(editingDelivery.expectedDate), 'd MMM yyyy', { locale: sv })}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <CalendarComponent
                          mode="single"
                          selected={new Date(editingDelivery.expectedDate)}
                          onSelect={(date) => date && setEditingDelivery({ 
                            ...editingDelivery, 
                            expectedDate: date.toISOString().split('T')[0] 
                          })}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
                
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="status" className="text-right">
                    Status
                  </Label>
                  <Select 
                    value={editingDelivery.status}
                    onValueChange={(value) => setEditingDelivery({ 
                      ...editingDelivery, 
                      status: value as 'pending' | 'in transit' | 'delivered' | 'delayed' 
                    })}
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Välj status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Väntande</SelectItem>
                      <SelectItem value="in transit">Under transport</SelectItem>
                      <SelectItem value="delivered">Levererad</SelectItem>
                      <SelectItem value="delayed">Försenad</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="quantity" className="text-right">
                    Kvantitet
                  </Label>
                  <div className="col-span-3 flex gap-2">
                    <Input
                      id="quantity"
                      type="number"
                      value={editingDelivery.quantity}
                      onChange={(e) => setEditingDelivery({ 
                        ...editingDelivery, 
                        quantity: parseInt(e.target.value) || 1 
                      })}
                      className="w-24"
                    />
                    <Input
                      value={editingDelivery.unit}
                      onChange={(e) => setEditingDelivery({ ...editingDelivery, unit: e.target.value })}
                      className="w-20"
                      placeholder="st"
                    />
                  </div>
                </div>
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDeliveryDialogOpen(false)}>
                  Avbryt
                </Button>
                <Button onClick={handleSaveDelivery}>Spara</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
} 