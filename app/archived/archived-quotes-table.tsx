"use client"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { FileText } from "lucide-react"
import type { Quote } from "@/lib/types"

interface ArchivedQuotesTableProps {
  quotes: Quote[]
}

export function ArchivedQuotesTable({ quotes }: ArchivedQuotesTableProps) {
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null)
  const [isViewQuoteOpen, setIsViewQuoteOpen] = useState(false)

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
          {quotes.map((quote) => (
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
                  ? new Date(quote.changeHistory[quote.changeHistory.length - 1].timestamp).toLocaleDateString("sv-SE")
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
          ))}
        </TableBody>
      </Table>

      <Dialog open={isViewQuoteOpen} onOpenChange={setIsViewQuoteOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Offertdetaljer (Arkiverad)</DialogTitle>
          </DialogHeader>
          {selectedQuote && (
            <div className="space-y-6">
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
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="font-medium">Säljare</div>
                    <div>{selectedQuote.salesperson}</div>
                  </div>
                  <div>
                    <div className="font-medium">Status</div>
                    <div>{selectedQuote.status}</div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="font-medium">Offertdatum</div>
                    <div>{new Date(selectedQuote.quoteDate).toLocaleDateString("sv-SE")}</div>
                  </div>
                  <div>
                    <div className="font-medium">Deadline</div>
                    <div>{new Date(selectedQuote.deadline).toLocaleDateString("sv-SE")}</div>
                  </div>
                </div>
                <div>
                  <div className="font-medium">Belopp</div>
                  <div>{selectedQuote.amount.toLocaleString("sv-SE")} kr</div>
                </div>
                <div>
                  <div className="font-medium">Kommentarer</div>
                  <div className="whitespace-pre-wrap">{selectedQuote.comments}</div>
                </div>

                {selectedQuote.changeHistory && selectedQuote.changeHistory.length > 0 && (
                  <div>
                    <div className="font-medium mb-2">Ändringshistorik</div>
                    <div className="space-y-3">
                      {selectedQuote.changeHistory.map((change, index) => (
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

