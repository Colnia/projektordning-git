"use client"

import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { type Quote, quoteSchema } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { toast } from "sonner"

interface QuoteFormProps {
  quote?: Quote
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: Quote) => Promise<void>
}

export function QuoteForm({ quote, open, onOpenChange, onSubmit }: QuoteFormProps) {
  const form = useForm<Quote>({
    resolver: zodResolver(quoteSchema),
    defaultValues: {
      id: "",
      projectName: "",
      customer: "",
      salesperson: "",
      quoteDate: new Date().toISOString().split("T")[0],
      deadline: "",
      amount: 0,
      status: "Skickad",
      comments: "",
      followUpDate: "",
    },
  })

  // Reset form with quote data when editing
  useEffect(() => {
    if (quote) {
      form.reset({
        id: quote.id,
        projectName: quote.projectName,
        customer: quote.customer,
        salesperson: quote.salesperson,
        quoteDate: quote.quoteDate,
        deadline: quote.deadline,
        amount: quote.amount,
        status: quote.status,
        comments: quote.comments,
        followUpDate: quote.followUpDate,
      })
    }
  }, [quote, form])

  async function handleSubmit(data: Quote) {
    try {
      // Add change history
      const change = {
        timestamp: new Date().toISOString(),
        user: "Aktuell användare", // I praktiken hämtas från auth
        changes: {},
        comment: data.comments,
      }

      // Jämför ändringar om det är en uppdatering
      if (quote) {
        Object.keys(data).forEach((key) => {
          if (data[key] !== quote[key]) {
            change.changes[key] = {
              from: quote[key],
              to: data[key],
            }
          }
        })
      }

      const updatedData = {
        ...data,
        changeHistory: [...(quote?.changeHistory || []), change],
      }

      await onSubmit(updatedData)
      toast.success(quote ? "Offert uppdaterad" : "Offert skapad")
      onOpenChange(false)
    } catch (error) {
      toast.error("Något gick fel")
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{quote ? "Redigera offert" : "Ny offert"}</DialogTitle>
          {quote && <DialogDescription>Offert ID: {quote.id}</DialogDescription>}
        </DialogHeader>
        <ScrollArea className="max-h-[80vh]">
          <div className="space-y-6 p-4">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="projectName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Projektnamn</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="customer"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Kund</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="salesperson"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Säljare</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="quoteDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Offertdatum</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="deadline"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Deadline</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Belopp (SEK)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            onChange={(e) => field.onChange(Number.parseFloat(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Välj status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Skickad">Skickad</SelectItem>
                            <SelectItem value="Under förhandling">Under förhandling</SelectItem>
                            <SelectItem value="Accepterad">Accepterad</SelectItem>
                            <SelectItem value="Avslagen">Avslagen</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="followUpDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Uppföljningsdatum</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="comments"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Kommentarer</FormLabel>
                      <FormControl>
                        <Textarea {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {quote?.changeHistory && quote.changeHistory.length > 0 && (
                  <div className="border rounded-lg p-4 space-y-4">
                    <h3 className="font-semibold">Ändringshistorik</h3>
                    <div className="space-y-3">
                      {quote.changeHistory.map((change, index) => (
                        <div key={index} className="text-sm space-y-1">
                          <div className="flex justify-between text-muted-foreground">
                            <span>{new Date(change.timestamp).toLocaleString("sv-SE")}</span>
                            <span>{change.user}</span>
                          </div>
                          {Object.entries(change.changes).map(([key, value]) => (
                            <div key={key} className="ml-4">
                              <span className="font-medium">{key}: </span>
                              <span className="text-destructive">{value.from}</span>
                              <span className="mx-2">→</span>
                              <span className="text-success">{value.to}</span>
                            </div>
                          ))}
                          {change.comment && (
                            <div className="ml-4 text-muted-foreground">Kommentar: {change.comment}</div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => onOpenChange(false)}>
                    Avbryt
                  </Button>
                  <Button type="submit">{quote ? "Uppdatera" : "Skapa"}</Button>
                </div>
              </form>
            </Form>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}

