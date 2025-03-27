"use client"

import { useState } from "react"
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
import { MoreHorizontal, Plus, Search, FileText, Trash2 } from "lucide-react"
import { QuoteForm } from "@/components/quote-form"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useProjectStore } from "@/lib/store"
import type { Quote } from "@/lib/types"
import { toast } from "sonner"

export function QuotesTable() {
  const [searchTerm, setSearchTerm] = useState("")
  const [isNewQuoteOpen, setIsNewQuoteOpen] = useState(false)
  const [isEditQuoteOpen, setIsEditQuoteOpen] = useState(false)
  const [isViewQuoteOpen, setIsViewQuoteOpen] = useState(false)
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

  const { quotes, addQuote, updateQuote, archiveQuote, deleteQuote } = useProjectStore()

  const filteredQuotes = quotes.filter(
    (quote) =>
      quote.projectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      quote.customer.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  async function handleCreateQuote(data: Quote) {
    const newQuote = { ...data, id: `Q${quotes.length + 1}`.padStart(4, "0") }
    addQuote(newQuote)
    setIsNewQuoteOpen(false)
    toast.success("Offert skapad")
  }

  async function handleUpdateQuote(data: Quote) {
    updateQuote(data)
    setIsEditQuoteOpen(false)
    toast.success("Offert uppdaterad")
  }

  async function handleArchiveQuote(quote: Quote) {
    archiveQuote(quote)
    toast.success("Offert arkiverad")
  }

  function handleEditQuote(quote: Quote) {
    setSelectedQuote({ ...quote })
    setIsEditQuoteOpen(true)
  }

  function handleDeleteClick(quote: Quote) {
    setSelectedQuote(quote)
    setIsDeleteDialogOpen(true)
  }

  function handleConfirmDelete() {
    if (selectedQuote) {
      deleteQuote(selectedQuote.id!)
      toast.success("Offert borttagen")
      setIsDeleteDialogOpen(false)
      setSelectedQuote(null)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Input
            placeholder="Sök offerter..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-[300px]"
          />
          <Search className="text-muted-foreground" />
        </div>
        <Button onClick={() => setIsNewQuoteOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Ny Offert
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Offert ID</TableHead>
              <TableHead>Projektnamn</TableHead>
              <TableHead>Kund</TableHead>
              <TableHead>Säljare</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Belopp</TableHead>
              <TableHead>Deadline</TableHead>
              <TableHead>Uppföljning</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredQuotes.map((quote) => (
              <TableRow key={quote.id}>
                <TableCell>{quote.id}</TableCell>
                <TableCell>{quote.projectName}</TableCell>
                <TableCell>{quote.customer}</TableCell>
                <TableCell>{quote.salesperson}</TableCell>
                <TableCell>
                  <div
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium
                    ${
                      quote.status === "Under förhandling"
                        ? "bg-primary/10 text-primary"
                        : quote.status === "Avslagen"
                          ? "bg-destructive/10 text-destructive"
                          : quote.status === "Accepterad"
                            ? "bg-success/10 text-success"
                            : "bg-warning/10 text-warning"
                    }`}
                  >
                    {quote.status}
                  </div>
                </TableCell>
                <TableCell>{quote.amount.toLocaleString("sv-SE")} kr</TableCell>
                <TableCell>{new Date(quote.deadline).toLocaleDateString("sv-SE")}</TableCell>
                <TableCell>{new Date(quote.followUpDate).toLocaleDateString("sv-SE")}</TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Åtgärder</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => {
                          setSelectedQuote(quote)
                          setIsViewQuoteOpen(true)
                        }}
                      >
                        <FileText className="mr-2 h-4 w-4" />
                        Visa detaljer
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleEditQuote(quote)}>Redigera</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleArchiveQuote(quote)}>Arkivera</DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => handleDeleteClick(quote)}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Ta bort
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <QuoteForm open={isNewQuoteOpen} onOpenChange={setIsNewQuoteOpen} onSubmit={handleCreateQuote} />

      <QuoteForm
        quote={selectedQuote || undefined}
        open={isEditQuoteOpen}
        onOpenChange={setIsEditQuoteOpen}
        onSubmit={handleUpdateQuote}
      />

      <Dialog open={isViewQuoteOpen} onOpenChange={setIsViewQuoteOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Offertdetaljer</DialogTitle>
          </DialogHeader>
          {selectedQuote && (
            <div className="grid gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="font-medium">Projektnamn</div>
                  <div>{selectedQuote.projectName}</div>
                </div>
                <div>
                  <div className="font-medium">Kund</div>
                  <div>{selectedQuote.customer}</div>
                </div>
              </div>
              {/* Rest of the quote details... */}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Är du säker?</AlertDialogTitle>
            <AlertDialogDescription>
              Detta kommer permanent ta bort offerten. Denna åtgärd kan inte ångras.
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

