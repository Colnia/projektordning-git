"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { FileText } from "lucide-react"
import { useProjectStore } from "@/lib/store"
import type { Quote } from "@/lib/types"

interface ArchivedQuotesListProps {
  searchTerm: string
}

export function ArchivedQuotesList({ searchTerm }: ArchivedQuotesListProps) {
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null)
  const [isViewQuoteOpen, setIsViewQuoteOpen] = useState(false)

  const { archivedQuotes } = useProjectStore()

  const filteredQuotes =
    archivedQuotes?.filter(
      (quote) =>
        quote.projectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        quote.customer.toLowerCase().includes(searchTerm.toLowerCase()),
    ) ?? []

  return (
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
            <TableHead>Arkiveringsdatum</TableHead>
            <TableHead></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredQuotes.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="text-center py-4">
                Inga arkiverade offerter hittades
              </TableCell>
            </TableRow>
          ) : (
            filteredQuotes.map((quote) => (
              <TableRow key={quote.id}>
                <TableCell>{quote.id}</TableCell>
                <TableCell>{quote.projectName}</TableCell>
                <TableCell>{quote.customer}</TableCell>
                <TableCell>{quote.salesperson}</TableCell>
                <TableCell>
                  <div
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium
                      ${
                        quote.status === "Accepterad"
                          ? "bg-success/10 text-success"
                          : quote.status === "Avslagen"
                            ? "bg-destructive/10 text-destructive"
                            : "bg-muted text-muted-foreground"
                      }`}
                  >
                    {quote.status}
                  </div>
                </TableCell>
                <TableCell>{quote.amount.toLocaleString("sv-SE")} kr</TableCell>
                <TableCell>
                  {quote.changeHistory?.[quote.changeHistory.length - 1]?.timestamp
                    ? new Date(quote.changeHistory[quote.changeHistory.length - 1].timestamp).toLocaleDateString(
                        "sv-SE",
                      )
                    : "-"}
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setSelectedQuote(quote)
                      setIsViewQuoteOpen(true)
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

      <Dialog open={isViewQuoteOpen} onOpenChange={setIsViewQuoteOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Offertdetaljer (Arkiverad)</DialogTitle>
          </DialogHeader>
          {selectedQuote && (
            <div className="space-y-6">{/* ... (rest of the dialog content remains the same) ... */}</div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

