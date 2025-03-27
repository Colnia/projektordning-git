"use client"

import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { type Project, projectSchema } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { toast } from "sonner"
import { DocumentUploader } from "@/components/document-uploader"

interface ProjectFormProps {
  project?: Project
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: Project) => Promise<void>
}

export function ProjectForm({ project, open, onOpenChange, onSubmit }: ProjectFormProps) {
  const form = useForm<Project>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      id: "",
      name: "",
      customer: "",
      manager: "",
      startDate: "",
      plannedEndDate: "",
      actualEndDate: "",
      status: "Planering",
      budget: 0,
      costToDate: 0,
      estimatedTotalCost: 0,
      milestones: "",
      comments: "",
      changeHistory: [],
      documents: [],
    },
  })

  // När projekt uppdateras eller dialogen öppnas, uppdatera formuläret
  useEffect(() => {
    if (project && open) {
      // Återställ formuläret med projektdata
      const defaultValues = {
        ...project,
      }
      Object.keys(defaultValues).forEach((key) => {
        // @ts-ignore - ignorera typfel eftersom vi itererar över nycklar
        form.setValue(key, defaultValues[key])
      })
    } else if (!project && open) {
      // Återställ formuläret till standardvärden
      form.reset({
        id: "",
        name: "",
        customer: "",
        manager: "",
        startDate: "",
        plannedEndDate: "",
        actualEndDate: "",
        status: "Planering",
        budget: 0,
        costToDate: 0,
        estimatedTotalCost: 0,
        milestones: "",
        comments: "",
        changeHistory: [],
        documents: [],
      })
    }
  }, [project, open, form])

  async function handleSubmit(data: Project) {
    try {
      await onSubmit(data)
      toast.success(project ? "Projekt uppdaterat" : "Projekt skapat")
    } catch (error) {
      console.error("Error saving project:", error)
      toast.error("Det gick inte att spara projektet")
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
            {project ? "Redigera projekt" : "Skapa nytt projekt"}
          </DialogTitle>
          <DialogDescription className="text-gray-500">
            Fyll i projektdetaljerna nedan för att {project ? "uppdatera" : "skapa"} ett projekt.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[calc(100vh-200px)] pr-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-medium">Projektnamn</FormLabel>
                      <FormControl>
                        <Input placeholder="Ange projektnamn" className="border-gray-300 focus:border-blue-500" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="customer"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-medium">Kund</FormLabel>
                      <FormControl>
                        <Input placeholder="Ange kundnamn" className="border-gray-300 focus:border-blue-500" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="manager"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-medium">Projektledare</FormLabel>
                      <FormControl>
                        <Input placeholder="Ange projektledare" className="border-gray-300 focus:border-blue-500" {...field} />
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
                      <FormLabel className="font-medium">Status</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="border-gray-300 focus:border-blue-500">
                            <SelectValue placeholder="Välj status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Planering">Planering</SelectItem>
                          <SelectItem value="Pågående">Pågående</SelectItem>
                          <SelectItem value="Färdigt">Färdigt</SelectItem>
                          <SelectItem value="Försenat">Försenat</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-medium">Startdatum</FormLabel>
                      <FormControl>
                        <Input type="date" className="border-gray-300 focus:border-blue-500" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="plannedEndDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-medium">Planerat slutdatum</FormLabel>
                      <FormControl>
                        <Input type="date" className="border-gray-300 focus:border-blue-500" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="actualEndDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-medium">Faktiskt slutdatum</FormLabel>
                      <FormControl>
                        <Input type="date" className="border-gray-300 focus:border-blue-500" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="budget"
                  render={({ field: { value, onChange, ...rest } }) => (
                    <FormItem>
                      <FormLabel className="font-medium">Budget</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="Ange budget"
                          className="border-gray-300 focus:border-blue-500"
                          value={value}
                          onChange={(e) => onChange(Number(e.target.value))}
                          {...rest}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="costToDate"
                  render={({ field: { value, onChange, ...rest } }) => (
                    <FormItem>
                      <FormLabel className="font-medium">Kostnad hittills</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="Ange kostnad"
                          className="border-gray-300 focus:border-blue-500"
                          value={value}
                          onChange={(e) => onChange(Number(e.target.value))}
                          {...rest}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="estimatedTotalCost"
                  render={({ field: { value, onChange, ...rest } }) => (
                    <FormItem>
                      <FormLabel className="font-medium">Uppskattad totalkostnad</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="Ange uppskattad totalkostnad"
                          className="border-gray-300 focus:border-blue-500"
                          value={value}
                          onChange={(e) => onChange(Number(e.target.value))}
                          {...rest}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="col-span-1 md:col-span-2">
                  <FormField
                    control={form.control}
                    name="milestones"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-medium">Milstolpar</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Beskriv projektets milstolpar"
                            className="min-h-[80px] resize-y border-gray-300 focus:border-blue-500"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="col-span-1 md:col-span-2">
                  <FormField
                    control={form.control}
                    name="comments"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-medium">Kommentarer</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Lägg till kommentarer"
                            className="min-h-[100px] resize-y border-gray-300 focus:border-blue-500"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="font-medium text-gray-900">Dokument</h3>
                <DocumentUploader />
              </div>

              <div className="flex justify-end space-x-4 pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  className="border-gray-300 hover:bg-gray-100"
                >
                  Avbryt
                </Button>
                <Button 
                  type="submit" 
                  className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white"
                >
                  {project ? "Uppdatera" : "Skapa"}
                </Button>
              </div>
            </form>
          </Form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}

