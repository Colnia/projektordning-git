"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { FileText } from "lucide-react"
import { useProjectStore } from "@/lib/store"
import type { Project } from "@/lib/types"

interface ArchivedProjectsListProps {
  searchTerm: string
}

export function ArchivedProjectsList({ searchTerm }: ArchivedProjectsListProps) {
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [isViewProjectOpen, setIsViewProjectOpen] = useState(false)

  const { archivedProjects } = useProjectStore()

  const filteredProjects =
    archivedProjects?.filter(
      (project) =>
        project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.customer.toLowerCase().includes(searchTerm.toLowerCase()),
    ) ?? []

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Projekt ID</TableHead>
            <TableHead>Projektnamn</TableHead>
            <TableHead>Kund</TableHead>
            <TableHead>Projektledare</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Budget</TableHead>
            <TableHead>Slutkostnad</TableHead>
            <TableHead>Arkiveringsdatum</TableHead>
            <TableHead></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredProjects.length === 0 ? (
            <TableRow>
              <TableCell colSpan={9} className="text-center py-4">
                Inga arkiverade projekt hittades
              </TableCell>
            </TableRow>
          ) : (
            filteredProjects.map((project) => (
              <TableRow key={project.id}>
                <TableCell>{project.id}</TableCell>
                <TableCell>{project.name}</TableCell>
                <TableCell>{project.customer}</TableCell>
                <TableCell>{project.manager}</TableCell>
                <TableCell>
                  <div
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium
                      ${
                        project.status === "Färdigt" ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"
                      }`}
                  >
                    {project.status}
                  </div>
                </TableCell>
                <TableCell>{project.budget.toLocaleString("sv-SE")} kr</TableCell>
                <TableCell>{project.costToDate.toLocaleString("sv-SE")} kr</TableCell>
                <TableCell>
                  {project.changeHistory?.[project.changeHistory.length - 1]?.timestamp
                    ? new Date(project.changeHistory[project.changeHistory.length - 1].timestamp).toLocaleDateString(
                        "sv-SE",
                      )
                    : "-"}
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setSelectedProject(project)
                      setIsViewProjectOpen(true)
                    }}
                  >
                    <FileText className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      <Dialog open={isViewProjectOpen} onOpenChange={setIsViewProjectOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Projektdetaljer (Arkiverat)</DialogTitle>
          </DialogHeader>
          {selectedProject && (
            <div className="space-y-6">{/* ... (rest of the dialog content remains the same) ... */}</div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

