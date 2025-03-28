"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from "@/components/ui/popover"
import { format } from "date-fns"
import { sv } from "date-fns/locale"
import { CalendarIcon, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

export interface TaskFormData {
  id?: string
  name: string
  projectId: string
  startDate: Date
  endDate: Date
  status: string
  completionRate?: number
  color?: string
}

export interface TaskFormProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: TaskFormData) => Promise<void>
  task?: TaskFormData
  projectId: string
  mode: 'create' | 'edit'
}

export function TaskForm({ isOpen, onClose, onSubmit, task, projectId, mode }: TaskFormProps) {
  const [formData, setFormData] = useState<TaskFormData>(
    task || {
      name: '',
      projectId: projectId,
      startDate: new Date(),
      endDate: new Date(),
      status: 'not-started',
      completionRate: 0,
      color: '#6366f1' // Default indigo color
    }
  )
  
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    
    // Validera inputs
    if (!formData.name) {
      setError("Namn är obligatoriskt")
      return
    }
    
    if (formData.endDate < formData.startDate) {
      setError("Slutdatum måste vara efter startdatum")
      return
    }
    
    try {
      setIsSubmitting(true)
      await onSubmit(formData)
      onClose()
    } catch (error) {
      setError("Ett fel inträffade när uppgiften skulle sparas")
      console.error(error)
    } finally {
      setIsSubmitting(false)
    }
  }
  
  const handleChange = (field: keyof TaskFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }
  
  return (
    <Dialog open={isOpen} onOpenChange={isOpen => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? 'Skapa ny fas' : 'Redigera fas'}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="name">Namn</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="Fasnamn"
              required
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Startdatum</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="startDate"
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formData.startDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.startDate ? (
                      format(formData.startDate, "PPP", { locale: sv })
                    ) : (
                      <span>Välj datum</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.startDate}
                    onSelect={(date) => date && handleChange('startDate', date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="endDate">Slutdatum</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="endDate"
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formData.endDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.endDate ? (
                      format(formData.endDate, "PPP", { locale: sv })
                    ) : (
                      <span>Välj datum</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.endDate}
                    onSelect={(date) => date && handleChange('endDate', date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select 
              value={formData.status} 
              onValueChange={(value) => handleChange('status', value)}
            >
              <SelectTrigger id="status">
                <SelectValue placeholder="Välj status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="not-started">Ej påbörjad</SelectItem>
                <SelectItem value="in-progress">Pågående</SelectItem>
                <SelectItem value="completed">Slutförd</SelectItem>
                <SelectItem value="delayed">Försenad</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {mode === 'edit' && (
            <div className="space-y-2">
              <Label htmlFor="completionRate">Färdigställandegrad (%)</Label>
              <Input
                id="completionRate"
                type="number"
                min="0"
                max="100"
                value={formData.completionRate || 0}
                onChange={(e) => handleChange('completionRate', parseInt(e.target.value))}
              />
            </div>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="color">Färg</Label>
            <div className="flex items-center gap-2">
              <Input
                id="color"
                type="color"
                className="w-12 h-10 p-1"
                value={formData.color || '#6366f1'}
                onChange={(e) => handleChange('color', e.target.value)}
              />
              <Input
                value={formData.color || '#6366f1'}
                onChange={(e) => handleChange('color', e.target.value)}
                placeholder="#HEX"
                className="flex-1"
              />
            </div>
          </div>
          
          {error && (
            <div className="text-red-500 text-sm mt-2">{error}</div>
          )}
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Avbryt
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sparar...
                </>
              ) : (
                mode === 'create' ? 'Skapa' : 'Uppdatera'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
} 