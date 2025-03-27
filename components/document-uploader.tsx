"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { toast } from "sonner"
import { FileUp, Download, Trash2, File, Image, FileText, FileSpreadsheet } from "lucide-react"
import type { Document } from "@/lib/types"

interface DocumentUploaderProps {
  documents?: Document[]
  onUpload: (document: Document) => void
  onDelete: (documentId: string) => void
}

export function DocumentUploader({ documents = [], onUpload, onDelete }: DocumentUploaderProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Kontrollera filstorlek
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Filen är för stor (max 5MB)")
      return
    }

    setIsUploading(true)

    try {
      const formData = new FormData()
      formData.append("file", file)

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Uppladdning misslyckades")
      }

      const data = await response.json()
      const newDocument: Document = {
        id: data.id,
        name: file.name,
        size: file.size,
        type: file.type,
        url: data.url,
        uploadedAt: new Date().toISOString(),
        uploadedBy: "Aktuell användare", // I praktiken hämtas från auth
      }

      onUpload(newDocument)
      toast.success("Dokument uppladdat")
    } catch (error) {
      console.error("Upload error:", error)
      toast.error(error instanceof Error ? error.message : "Kunde inte ladda upp dokumentet")
    } finally {
      setIsUploading(false)
      // Återställ input-fältet
      event.target.value = ""
    }
  }

  const handleDelete = async (documentId: string) => {
    try {
      await fetch(`/api/documents/${documentId}`, {
        method: "DELETE",
      })
      onDelete(documentId)
      toast.success("Dokument borttaget")
    } catch (error) {
      console.error("Delete error:", error)
      toast.error("Kunde inte ta bort dokumentet")
    }
  }

  const getFileIcon = (type: string) => {
    if (type.startsWith("image/")) return <Image className="h-4 w-4" />
    if (type.includes("spreadsheet")) return <FileSpreadsheet className="h-4 w-4" />
    if (type.includes("pdf") || type.includes("text")) return <FileText className="h-4 w-4" />
    return <File className="h-4 w-4" />
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  // Säkerställ att documents alltid är en array
  const documentList = Array.isArray(documents) ? documents : []

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <FileUp className="mr-2 h-4 w-4" />
          Hantera dokument
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[800px]">
        <DialogHeader>
          <DialogTitle>Dokumenthantering</DialogTitle>
          <DialogDescription>
            Ladda upp, visa och hantera dokument. Stödjer de flesta filformat upp till 5MB.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <Input
              type="file"
              onChange={handleFileUpload}
              disabled={isUploading}
              className="w-full"
              aria-label="Välj fil att ladda upp"
            />
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Typ</TableHead>
                  <TableHead>Namn</TableHead>
                  <TableHead>Storlek</TableHead>
                  <TableHead>Uppladdad</TableHead>
                  <TableHead>Av</TableHead>
                  <TableHead>Åtgärder</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {documentList.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground">
                      Inga dokument uppladdade
                    </TableCell>
                  </TableRow>
                ) : (
                  documentList.map((doc) => (
                    <TableRow key={doc.id}>
                      <TableCell>{getFileIcon(doc.type)}</TableCell>
                      <TableCell>{doc.name}</TableCell>
                      <TableCell>{formatFileSize(doc.size)}</TableCell>
                      <TableCell>{new Date(doc.uploadedAt).toLocaleDateString("sv-SE")}</TableCell>
                      <TableCell>{doc.uploadedBy}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => window.open(doc.url, "_blank")}
                            aria-label={`Ladda ner ${doc.name}`}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(doc.id)}
                            aria-label={`Ta bort ${doc.name}`}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

