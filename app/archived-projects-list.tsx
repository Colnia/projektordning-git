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

  const filteredProjects = archivedProjects.filter(
    (project) =>
      project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.customer.toLowerCase().includes(searchTerm.toLowerCase()),
  )

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
          {filteredProjects.map((project) => (
            <TableRow key={project.id}>
              <TableCell>{project.id}</TableCell>
              <TableCell>{project.name}</TableCell>
              <TableCell>{project.customer}</TableCell>
              <TableCell>{project.manager}</TableCell>
              <TableCell>
                <div
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium
                    ${project.status === "Färdigt" ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"}`}
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
          ))}
        </TableBody>
      </Table>

      <Dialog open={isViewProjectOpen} onOpenChange={setIsViewProjectOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Projektdetaljer (Arkiverat)</DialogTitle>
          </DialogHeader>
          {selectedProject && (
            <div className="space-y-6">
              <div className="grid gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="font-medium">Projektnamn</div>
                    <div>{selectedProject.name}</div>
                  </div>
                  <div>
                    <div className="font-medium">Kund</div>
                    <div>{selectedProject.customer}</div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="font-medium">Projektledare</div>
                    <div>{selectedProject.manager}</div>
                  </div>
                  <div>
                    <div className="font-medium">Status</div>
                    <div>{selectedProject.status}</div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="font-medium">Startdatum</div>
                    <div>{new Date(selectedProject.startDate).toLocaleDateString("sv-SE")}</div>
                  </div>
                  <div>
                    <div className="font-medium">Slutdatum</div>
                    <div>
                      {selectedProject.actualEndDate
                        ? new Date(selectedProject.actualEndDate).toLocaleDateString("sv-SE")
                        : new Date(selectedProject.plannedEndDate).toLocaleDateString("sv-SE")}
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="font-medium">Budget</div>
                    <div>{selectedProject.budget.toLocaleString("sv-SE")} kr</div>
                  </div>
                  <div>
                    <div className="font-medium">Slutkostnad</div>
                    <div>{selectedProject.costToDate.toLocaleString("sv-SE")} kr</div>
                  </div>
                </div>
                <div>
                  <div className="font-medium">Milstolpar</div>
                  <div className="whitespace-pre-wrap">{selectedProject.milestones}</div>
                </div>
                <div>
                  <div className="font-medium">Kommentarer</div>
                  <div className="whitespace-pre-wrap">{selectedProject.comments}</div>
                </div>

                {selectedProject.changeHistory && selectedProject.changeHistory.length > 0 && (
                  <div>
                    <div className="font-medium mb-2">Ändringshistorik</div>
                    <div className="space-y-3">
                      {selectedProject.changeHistory.map((change, index) => (
                        <div key={index} className="text-sm border-l-2 border-muted pl-4 py-2">
                          <div className="flex justify-between text-muted-foreground">
                            <span>{new Date(change.timestamp).toLocaleString("sv-SE")}</span>
                            <span>{change.user}</span>
                          </div>
                          {Object.entries(change.changes).map(([key, value]) => (
                            <div key={key} className="mt-1">
                              <span className="font-medium">{key}: </span>
                              <span className="text-destructive">{value.from}</span>
                              <span className="mx-2">→</span>
                              <span className="text-success">{value.to}</span>
                            </div>
                          ))}
                          {change.comment && (
                            <div className="mt-1 text-muted-foreground">Kommentar: {change.comment}</div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

