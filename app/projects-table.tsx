"use client"

import { useState, useMemo, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { MoreHorizontal, Plus, Search, FileText, Trash2, Edit, Archive } from "lucide-react"
import { ProjectForm } from "@/components/project-form"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useProjectStore } from "@/lib/store"
import type { Project } from "@/lib/types"
import { toast } from "sonner"
import { AdvancedFilter } from "@/components/advanced-filter"
import { Skeleton } from "@/components/ui/skeleton"

export function ProjectsTable() {
  const { projects, isLoading, loadProjects, addProject, updateProject, archiveProject, deleteProject } = useProjectStore()
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [activeFilters, setActiveFilters] = useState<{[key: string]: string[]}>({})

  // Ladda projekt vid montering
  useEffect(() => {
    loadProjects().catch(error => {
      console.error('Kunde inte ladda projekt:', error);
      toast.error('Kunde inte ladda projekt från databasen.');
    });
  }, [loadProjects]);

  // Filter options
  const projectFilterOptions = [
    {
      id: "status",
      label: "Status",
      options: [
        { value: "Planering", label: "Planering" },
        { value: "Pågående", label: "Pågående" },
        { value: "Färdigt", label: "Färdigt" },
        { value: "Försenat", label: "Försenat" },
      ],
    },
    {
      id: "customer",
      label: "Kund",
      options: [...new Set(projects.map(p => p.customer))].map(customer => ({
        value: customer,
        label: customer,
      })),
    },
    {
      id: "manager",
      label: "Projektledare",
      options: [...new Set(projects.map(p => p.manager))].map(manager => ({
        value: manager,
        label: manager,
      })),
    },
  ]

  // Filter projects based on search query and active filters
  const filteredProjects = useMemo(() => {
    return projects.filter(project => {
      // Text search
      const matchesSearch = 
        searchQuery === "" ||
        project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        project.customer.toLowerCase().includes(searchQuery.toLowerCase()) ||
        project.manager.toLowerCase().includes(searchQuery.toLowerCase());
      
      if (!matchesSearch) return false;
      
      // Advanced filters
      for (const [filterId, values] of Object.entries(activeFilters)) {
        if (values.length === 0) continue;
        
        switch (filterId) {
          case "status":
            if (!values.includes(project.status)) return false;
            break;
          case "customer":
            if (!values.includes(project.customer)) return false;
            break;
          case "manager":
            if (!values.includes(project.manager)) return false;
            break;
        }
      }
      
      return true;
    });
  }, [projects, searchQuery, activeFilters]);

  async function handleCreateProject(data: Project) {
    const newProject = { ...data, id: `PRJ${projects.length + 1}`.padStart(6, "0") }
    addProject(newProject)
    setIsCreateDialogOpen(false)
    toast.success("Projekt skapat")
  }

  async function handleUpdateProject(data: Project) {
    updateProject(data)
    setIsEditDialogOpen(false)
    toast.success("Projekt uppdaterat")
  }

  async function handleArchiveProject(project: Project) {
    archiveProject(project)
    toast.success("Projekt arkiverat")
  }

  function handleEditProject(project: Project) {
    setSelectedProject({ ...project })
    setIsEditDialogOpen(true)
  }

  function handleDeleteClick(project: Project) {
    setSelectedProject(project)
    setIsDeleteDialogOpen(true)
  }

  function handleConfirmDelete() {
    if (selectedProject) {
      deleteProject(selectedProject.id!)
      toast.success("Projekt borttaget")
      setIsDeleteDialogOpen(false)
      setSelectedProject(null)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 w-full max-w-sm">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Sök projekt..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-9"
          />
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nytt projekt
          </Button>
        </div>
      </div>
      
      <AdvancedFilter 
        filters={projectFilterOptions} 
        onFilterChange={setActiveFilters} 
      />

      <div className="rounded-md border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="font-medium">Projekt</TableHead>
              <TableHead className="font-medium">Kund</TableHead>
              <TableHead className="font-medium">Projektledare</TableHead>
              <TableHead className="font-medium">Status</TableHead>
              <TableHead className="font-medium text-right">Budget</TableHead>
              <TableHead className="font-medium text-right">Kostnader</TableHead>
              <TableHead className="font-medium text-right">Återstår</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              // Visa laddningsindikator när data hämtas
              Array.from({ length: 3 }).map((_, index) => (
                <TableRow key={`skeleton-${index}`}>
                  <TableCell colSpan={8}>
                    <Skeleton className="h-8 w-full" />
                  </TableCell>
                </TableRow>
              ))
            ) : filteredProjects.length === 0 ? (
              // Visa meddelande när inga projekt matchar
              <TableRow>
                <TableCell colSpan={8} className="h-24 text-center">
                  Inga projekt hittades.
                </TableCell>
              </TableRow>
            ) : (
              // Visa projekt
              filteredProjects.map((project) => (
                <TableRow key={project.id} className="hover:bg-muted/40 cursor-pointer" onClick={() => handleEditProject(project)}>
                  <TableCell>
                    {project.name}
                    <div className="text-xs text-muted-foreground">{project.startDate} - {project.plannedEndDate}</div>
                  </TableCell>
                  <TableCell>{project.customer}</TableCell>
                  <TableCell>{project.manager}</TableCell>
                  <TableCell>
                    <div
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium
                      ${
                        project.status === "Pågående"
                          ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
                          : project.status === "Försenat"
                            ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
                            : project.status === "Färdigt"
                              ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                              : "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300"
                      }`}
                    >
                      {project.status}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">{project.budget?.toLocaleString("sv-SE") ?? 0} kr</TableCell>
                  <TableCell className="text-right">{project.costToDate?.toLocaleString("sv-SE") ?? 0} kr</TableCell>
                  <TableCell className="text-right">{((project.budget ?? 0) - (project.costToDate ?? 0)).toLocaleString("sv-SE")} kr</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="icon" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Åtgärder</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Åtgärder</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={(e) => {
                          e.stopPropagation();
                          handleEditProject(project);
                        }}>
                          <Edit className="mr-2 h-4 w-4" />
                          Redigera
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => {
                          e.stopPropagation();
                          handleArchiveProject(project);
                        }}>
                          <Archive className="mr-2 h-4 w-4" />
                          Arkivera
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteClick(project);
                          }}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Ta bort
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <ProjectForm open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen} onSubmit={handleCreateProject} />

      <ProjectForm
        project={selectedProject || undefined}
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        onSubmit={handleUpdateProject}
      />

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Är du säker?</AlertDialogTitle>
            <AlertDialogDescription>
              Detta kommer permanent ta bort projektet. Denna åtgärd kan inte ångras.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Avbryt</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-destructive text-destructive-foreground">
              Ta bort
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

