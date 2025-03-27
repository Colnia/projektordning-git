"use client"

import { useState, useEffect, useCallback, useMemo } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar, User, Briefcase, Mail, DollarSign, Clock, Users, AlertTriangle, CheckCircle, Plus, Edit, Trash2 } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { toast } from "@/components/ui/use-toast"

interface Assignment {
  id: string | number;
  resourceId: string | number;
  resourceName: string;
  projectId: string | number;
  projectName: string;
  phaseId?: string | number | null;
  phaseName: string;
  startDate: string;
  endDate: string;
  hoursPerDay: number;
  totalHours: number;
}

interface Project {
  id: string | number;
  name: string;
  startDate: string;
  endDate: string;
  phases: any[];
  status: string;
}

interface Resource {
  id: string | number;
  name: string;
  type: string;
  email: string;
  skills: string[];
  capacity: number;
  costRate: number;
  assignments?: Assignment[];
}

interface ResourcesViewProps {
  resources: Resource[];
  projects: Project[];
}

// Resurstilldelning
interface ResourceAssignment {
  id: string | number;
  resourceId: string | number;
  resourceName?: string;
  projectId: string | number;
  projectName?: string;
  phaseId?: string | number | null;
  phaseName?: string;
  startDate: string;
  endDate: string;
  hoursPerDay: number;
  totalHours?: number;
}

// Definiera utökad resurstyp som inkluderar tilldelningar
interface EnhancedResource extends Omit<Resource, 'assignments'> {
  assignments: ResourceAssignment[];
  conflicts: Record<string, string[]>;
  utilization: number;
}

// Returnerar true om två datumintervall överlappar
const datesOverlap = (start1: string, end1: string, start2: string, end2: string) => {
  const s1 = new Date(start1).getTime();
  const e1 = new Date(end1).getTime();
  const s2 = new Date(start2).getTime();
  const e2 = new Date(end2).getTime();
  
  return (s1 <= e2 && e1 >= s2);
};

// Beräknar konflikter för en resurs baserat på överlappande uppdrag
const calculateConflicts = (assignments: Assignment[]) => {
  const conflicts: Record<string, string[]> = {};
  
  for (let i = 0; i < assignments.length; i++) {
    const a = assignments[i];
    const aId = String(a.id);
    
    for (let j = i + 1; j < assignments.length; j++) {
      const b = assignments[j];
      const bId = String(b.id);
      
      if (datesOverlap(a.startDate, a.endDate, b.startDate, b.endDate)) {
        if (!conflicts[aId]) conflicts[aId] = [];
        if (!conflicts[bId]) conflicts[bId] = [];
        
        conflicts[aId].push(bId);
        conflicts[bId].push(aId);
      }
    }
  }
  
  return conflicts;
};

// Beräknar en resurs beläggning för en specifik tidsperiod
const calculateUtilization = (resource: Resource, startDate: string, endDate: string) => {
  if (!resource.assignments || resource.assignments.length === 0) {
    return 0;
  }
  
  const start = new Date(startDate);
  const end = new Date(endDate);
  const totalDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  const workingDays = Math.max(Math.round(totalDays * 5/7), 1); // uppskattning av arbetsdagar
  
  const totalCapacity = workingDays * resource.capacity;
  let bookedHours = 0;
  
  resource.assignments.forEach(assignment => {
    const assignmentStart = new Date(assignment.startDate);
    const assignmentEnd = new Date(assignment.endDate);
    
    if (datesOverlap(startDate, endDate, assignment.startDate, assignment.endDate)) {
      // Beräkna överlappande period
      const overlapStart = assignmentStart < start ? start : assignmentStart;
      const overlapEnd = assignmentEnd > end ? end : assignmentEnd;
      const overlapDays = Math.ceil((overlapEnd.getTime() - overlapStart.getTime()) / (1000 * 60 * 60 * 24));
      
      // Uppskatta arbetsdagar i överlappande period
      const overlapWorkingDays = Math.max(Math.round(overlapDays * 5/7), 1);
      
      // Lägg till bokade timmar för denna period
      bookedHours += overlapWorkingDays * assignment.hoursPerDay;
    }
  });
  
  return Math.min(Math.round((bookedHours / totalCapacity) * 100), 100);
};

const ResourcesView = ({ resources = [], projects = [] }: ResourcesViewProps) => {
  const [searchQuery, setSearchQuery] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null)
  const [selectedView, setSelectedView] = useState('list')
  const [timeframe, setTimeframe] = useState('month')
  const [assignments, setAssignments] = useState<ResourceAssignment[]>([])
  const [isLoadingAssignments, setIsLoadingAssignments] = useState(false)
  const [isAssignmentDialogOpen, setIsAssignmentDialogOpen] = useState(false)
  const [assigningResource, setAssigningResource] = useState<Resource | null>(null)
  const [editingAssignment, setEditingAssignment] = useState<ResourceAssignment | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [enhancedResources, setEnhancedResources] = useState<EnhancedResource[]>([])
  
  // Öppna resursinformationsdialogen
  const openResourceDialog = (resource: Resource) => {
    setSelectedResource(resource)
    setDialogOpen(true)
  }
  
  // Öppna dialog för att lägga till tilldelning
  const openAssignmentDialog = (resource: Resource) => {
    setSelectedResource(resource)
    setEditingAssignment(null)
    setIsAssignmentDialogOpen(true)
  }
  
  // Öppna dialog för att redigera tilldelning
  const openEditAssignmentDialog = (assignment: ResourceAssignment) => {
    const resource = enhancedResources.find(r => 
      r.assignments.some(a => String(a.id) === String(assignment.id))
    );
    
    if (resource) {
      setSelectedResource(resource);
      setEditingAssignment(assignment);
      setIsAssignmentDialogOpen(true);
    }
  }
  
  // Hjälpfunktion för att formatera datum
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('sv-SE')
  }
  
  // Hämta resurstilldelningar från servern
  const fetchResourceAssignments = async () => {
    setIsLoadingAssignments(true)
    try {
      const response = await fetch('/api/planning/assignments')
      if (!response.ok) {
        throw new Error('Kunde inte hämta resurstilldelningar')
      }
      const data = await response.json()
      setAssignments(data.assignments || [])
    } catch (error) {
      console.error('Fel vid hämtning av resurstilldelningar:', error)
    } finally {
      setIsLoadingAssignments(false)
    }
  }
  
  // Filtrera resurser baserat på sökfråga
  const filteredResources = useMemo(() => {
    if (!searchQuery.trim()) return enhancedResources
    
    const query = searchQuery.toLowerCase().trim()
    return enhancedResources.filter(resource => 
      resource.name.toLowerCase().includes(query) || 
      resource.type.toLowerCase().includes(query) ||
      resource.skills.some(skill => skill.toLowerCase().includes(query))
    )
  }, [enhancedResources, searchQuery])
  
  // Hantera sparande av tilldelning
  const handleSaveAssignment = async (data: {
    projectId: string
    phaseId: string | null
    startDate: string
    endDate: string
    hoursPerDay: number
  }) => {
    if (!assigningResource && !editingAssignment) {
      console.error('Ingen resurs eller tilldelning vald')
      return
    }
    
    try {
      // Skapa tilldelningsobjekt
      const assignmentData = {
        type: 'assignment',
        assignment: {
          id: editingAssignment?.id, // Skicka med ID om vi redigerar, annars undefined för ny
          resourceId: assigningResource?.id || editingAssignment?.resourceId,
          projectId: data.projectId,
          phaseId: data.phaseId,
          startDate: data.startDate,
          endDate: data.endDate,
          hoursPerDay: data.hoursPerDay
        }
      }
      
      // Skicka tilldelning till API
      const response = await fetch('/api/planning', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(assignmentData)
      })
      
      if (!response.ok) {
        throw new Error('Kunde inte spara resurstilldelning')
      }
      
      const result = await response.json()
      
      // När vi sparar framgångsrikt, visa notis och stäng dialog
      toast({
        title: "Tilldelning sparad",
        description: `${assigningResource?.name || editingAssignment?.resourceName || 'Resurser'} har tilldelats projektet.`,
      })
      
      // Stäng dialogrutan
      setIsAssignmentDialogOpen(false)
      setEditingAssignment(null)
      setAssigningResource(null)
      
      // Ladda om data från servern
      fetchResourceAssignments()
    } catch (error) {
      console.error('Fel vid sparande av tilldelning:', error)
      toast({
        title: "Fel vid sparande",
        description: "Kunde inte spara resurstilldelningen. Försök igen.",
        variant: "destructive"
      })
    }
  }
  
  // Ta bort en tilldelning
  const removeAssignment = async (assignmentId: string | number) => {
    try {
      // Anropa API för att ta bort
      const response = await fetch(`/api/planning/assignments/${String(assignmentId)}`, {
        method: 'DELETE'
      })
      
      if (!response.ok) {
        throw new Error('Kunde inte ta bort resurstilldelning')
      }
      
      // När borttagningen är framgångsrik, visa notis
      toast({
        title: "Tilldelning borttagen",
        description: "Resurstilldelningen har tagits bort från projektet."
      })
      
      // Uppdatera UI genom att ladda om data från servern
      fetchResourceAssignments()
    } catch (error) {
      console.error('Fel vid borttagning av tilldelning:', error)
      toast({
        title: "Fel vid borttagning",
        description: "Kunde inte ta bort resurstilldelningen. Försök igen.",
        variant: "destructive"
      })
    }
  }
  
  // Ladda resurstilldelningar när komponenten monteras
  useEffect(() => {
    if (resources.length && projects.length) {
      fetchResourceAssignments()
    } else {
      setIsLoadingAssignments(false)
      setEnhancedResources([])
    }
  }, [resources, projects, fetchResourceAssignments])
  
  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="flex-1 flex gap-2">
          <Input
            placeholder="Sök efter resurser..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-sm"
          />
          <Select value={timeframe} onValueChange={setTimeframe}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Tidsperiod" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">1 vecka</SelectItem>
              <SelectItem value="month">1 månad</SelectItem>
              <SelectItem value="quarter">3 månader</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex gap-2">
          <Tabs value={selectedView} onValueChange={setSelectedView} className="w-[250px]">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="list">Lista</TabsTrigger>
              <TabsTrigger value="calendar">Kalender</TabsTrigger>
            </TabsList>
          </Tabs>
          
          <Button>
            <Users className="mr-2 h-4 w-4" />
            Lägg till resurs
          </Button>
        </div>
      </div>
      
      <TabsContent value="list" className="space-y-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Namn</TableHead>
              <TableHead>Roll</TableHead>
              <TableHead>Kompetenser</TableHead>
              <TableHead>Kapacitet</TableHead>
              <TableHead>Kostnad</TableHead>
              <TableHead className="text-right">Beläggning</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoadingAssignments ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  <div className="flex justify-center items-center">
                    Laddar resurser...
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredResources.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  Inga resurser hittades.
                </TableCell>
              </TableRow>
            ) : (
              filteredResources.map((resource) => (
                <TableRow key={resource.id}>
                  <TableCell className="font-medium">
                    {resource.name}
                    {resource.email && (
                      <div className="text-xs text-muted-foreground">{resource.email}</div>
                    )}
                  </TableCell>
                  <TableCell>{resource.type}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {resource.skills.map((skill, index) => (
                        <Badge variant="outline" key={index}>{skill}</Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>{resource.capacity} tim/vecka</TableCell>
                  <TableCell>{resource.costRate} kr/tim</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end space-x-2">
                      <div
                        className={`w-24 h-2 rounded-full ${
                          resource.utilization > 90
                            ? 'bg-red-500'
                            : resource.utilization > 70
                              ? 'bg-amber-500'
                              : 'bg-green-500'
                        }`}
                      >
                        <div
                          className="h-full bg-primary rounded-full"
                          style={{ width: `${resource.utilization}%` }}
                        />
                      </div>
                      <span className="text-sm">{resource.utilization}%</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" onClick={() => openResourceDialog(resource)}>
                              <User className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Visa detaljer</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => openAssignmentDialog(resource)}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Tilldela till projekt</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TabsContent>
      
      <TabsContent value="calendar" className="py-4">
        <div className="rounded-md border p-8 h-[300px] flex items-center justify-center">
          <div className="text-center">
            <Calendar className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-medium">Kalendervyn kommer snart</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Här kommer du att kunna se resursernas scheman över tid och planera deras tillgänglighet.
            </p>
          </div>
        </div>
      </TabsContent>
      
      {/* Dialog för resursdetaljer */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              {selectedResource?.name}{" "}
              <Badge className="ml-2">{selectedResource?.type}</Badge>
            </DialogTitle>
          </DialogHeader>

          {selectedResource && (
            <>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-medium mb-2">Kontaktinformation</h3>
                    <p className="text-sm flex items-center">
                      <Mail className="mr-2 h-4 w-4 text-muted-foreground" />
                      {selectedResource.email || "Ingen e-post angiven"}
                    </p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium mb-2">Kostnad och kapacitet</h3>
                    <p className="text-sm flex items-center mb-1">
                      <DollarSign className="mr-2 h-4 w-4 text-muted-foreground" />
                      {selectedResource.costRate} kr/timme
                    </p>
                    <p className="text-sm flex items-center">
                      <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                      {selectedResource.capacity} timmar/vecka
                    </p>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium mb-2">Kompetenser</h3>
                  <div className="flex flex-wrap gap-1">
                    {selectedResource.skills.map((skill, index) => (
                      <Badge key={index} variant="secondary">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-sm font-medium">Projekttilldelningar</h3>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => openAssignmentDialog(selectedResource)}
                    >
                      <Plus className="mr-2 h-3 w-3" />
                      Lägg till
                    </Button>
                  </div>
                  
                  <Card>
                    <ScrollArea className="h-[200px]">
                      {(enhancedResources.find(r => r.id === selectedResource.id)?.assignments || []).length === 0 ? (
                        <div className="p-4 text-center text-sm text-muted-foreground">
                          Inga aktiva tilldelningar
                        </div>
                      ) : (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Projekt</TableHead>
                              <TableHead>Fas</TableHead>
                              <TableHead>Period</TableHead>
                              <TableHead>Tim/dag</TableHead>
                              <TableHead></TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {enhancedResources
                              .find(r => r.id === selectedResource.id)
                              ?.assignments.map(assignment => (
                                <TableRow key={assignment.id}>
                                  <TableCell>{assignment.projectName}</TableCell>
                                  <TableCell>{assignment.phaseName}</TableCell>
                                  <TableCell>
                                    {formatDate(assignment.startDate)} - {formatDate(assignment.endDate)}
                                  </TableCell>
                                  <TableCell>{assignment.hoursPerDay}</TableCell>
                                  <TableCell>
                                    <div className="flex justify-end gap-2">
                                      <Button 
                                        variant="ghost" 
                                        size="icon"
                                        onClick={() => openEditAssignmentDialog(assignment)}
                                      >
                                        <Edit className="h-4 w-4" />
                                      </Button>
                                      <Button 
                                        variant="ghost" 
                                        size="icon"
                                        onClick={() => removeAssignment(assignment.id)}
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </TableCell>
                                </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      )}
                    </ScrollArea>
                  </Card>
                </div>

                {/* Konflikter */}
                {Object.keys(enhancedResources.find(r => r.id === selectedResource.id)?.conflicts || {}).length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium mb-2 flex items-center">
                      <AlertTriangle className="mr-2 h-4 w-4 text-amber-500" />
                      Potentiella konflikter
                    </h3>
                    <Card className="border-amber-200 bg-amber-50">
                      <CardContent className="p-4">
                        <ul className="text-sm space-y-2">
                          {Object.entries(enhancedResources.find(r => r.id === selectedResource.id)?.conflicts || {}).map(([assignmentId, conflictingIds]) => {
                            const assignment = enhancedResources.find(r => r.id === selectedResource.id)?.assignments.find(a => String(a.id) === assignmentId);
                            if (!assignment) return null;
                            
                            return (
                              <li key={assignmentId}>
                                <strong>{assignment.projectName}</strong> ({formatDate(assignment.startDate)} - {formatDate(assignment.endDate)})
                                <span className="text-muted-foreground"> överlappar med </span>
                                {conflictingIds.map(conflictId => {
                                  const conflictingAssignment = enhancedResources.find(r => r.id === selectedResource.id)?.assignments.find(a => String(a.id) === conflictId);
                                  return conflictingAssignment ? (
                                    <strong key={conflictId}>{conflictingAssignment.projectName}</strong>
                                  ) : null;
                                }).filter(Boolean).reduce((prev, curr, i, arr) => {
                                  return prev.length > 0 
                                    ? [...prev, i < arr.length - 1 ? ', ' : ' och ', curr] 
                                    : [curr];
                                }, [] as React.ReactNode[])}
                              </li>
                            );
                          })}
                        </ul>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog för att lägga till/redigera tilldelning */}
      <Dialog open={isAssignmentDialogOpen} onOpenChange={setIsAssignmentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingAssignment ? 'Redigera tilldelning' : 'Lägg till tilldelning'}
            </DialogTitle>
            <DialogDescription>
              Tilldela {selectedResource?.name} till ett projekt
            </DialogDescription>
          </DialogHeader>

          {selectedResource && (
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const projectId = formData.get('projectId') as string;
              const phaseId = formData.get('phaseId') as string || null;
              const startDate = formData.get('startDate') as string;
              const endDate = formData.get('endDate') as string;
              const hoursPerDay = Number(formData.get('hoursPerDay'));
              
              handleSaveAssignment({
                projectId,
                phaseId,
                startDate,
                endDate,
                hoursPerDay
              });
            }}>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="projectId" className="text-right">
                    Projekt
                  </Label>
                  <div className="col-span-3">
                    <Select 
                      name="projectId" 
                      defaultValue={editingAssignment?.projectId?.toString() || undefined}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Välj projekt" />
                      </SelectTrigger>
                      <SelectContent>
                        {projects.map(project => (
                          <SelectItem key={project.id} value={project.id.toString()}>
                            {project.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="phaseId" className="text-right">
                    Fas
                  </Label>
                  <div className="col-span-3">
                    <Select 
                      name="phaseId" 
                      defaultValue={editingAssignment?.phaseId?.toString() || undefined}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Välj fas (valfritt)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Genomförande (standard)</SelectItem>
                        {projects.flatMap(project => 
                          project.phases.map(phase => (
                            <SelectItem key={phase.id} value={phase.id.toString()}>
                              {project.name}: {phase.name}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="startDate" className="text-right">
                    Startdatum
                  </Label>
                  <div className="col-span-3">
                    <Input 
                      type="date" 
                      name="startDate" 
                      defaultValue={editingAssignment ? 
                        new Date(editingAssignment.startDate).toISOString().split('T')[0] : 
                        new Date().toISOString().split('T')[0]
                      } 
                      required
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="endDate" className="text-right">
                    Slutdatum
                  </Label>
                  <div className="col-span-3">
                    <Input 
                      type="date" 
                      name="endDate"
                      defaultValue={editingAssignment ? 
                        new Date(editingAssignment.endDate).toISOString().split('T')[0] : 
                        new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
                      }
                      required
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="hoursPerDay" className="text-right">
                    Timmar/dag
                  </Label>
                  <div className="col-span-3">
                    <Input 
                      type="number" 
                      name="hoursPerDay" 
                      defaultValue={editingAssignment?.hoursPerDay || 4}
                      min={1} 
                      max={24}
                      required
                    />
                  </div>
                </div>
              </div>
              
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsAssignmentDialogOpen(false)}
                >
                  Avbryt
                </Button>
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? 'Sparar...' : editingAssignment ? 'Uppdatera' : 'Spara'}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default ResourcesView 