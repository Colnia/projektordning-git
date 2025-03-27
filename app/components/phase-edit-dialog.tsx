import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarDays, Plus } from "lucide-react";
import { format } from "date-fns";
import { sv } from "date-fns/locale";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

interface Resource {
  id: string | number;
  name: string;
  hoursPerDay: number;
}

interface Phase {
  id: string | number;
  name: string;
  startDate: string | Date;
  endDate: string | Date;
  status: string;
  projectId: string | number;
  color?: string;
  completionRate?: number;
  description?: string;
  priority?: number;
  isBlocker?: boolean;
  isTemporary?: boolean;
  resources?: Resource[];
}

interface PhaseEditDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  onDelete?: (phaseId: string | number) => void;
  phase: Phase;
  editingPhase: {
    name: string;
    startDate: Date;
    endDate: Date;
    status: string;
    description: string;
    priority: number;
    isBlocker: boolean;
    completionRate: number;
    resources: Resource[];
  } | null;
  setEditingPhase: (phase: any) => void;
  handleChangeResourceHours: (resourceId: string | number, hours: number) => void;
  handleRemoveResource: (resourceId: string | number) => void;
  handleOpenResourceDialog: () => void;
}

export function PhaseEditDialog({ 
  isOpen,
  onClose,
  onSave,
  onDelete,
  phase,
  editingPhase,
  setEditingPhase,
  handleChangeResourceHours,
  handleRemoveResource,
  handleOpenResourceDialog
}: PhaseEditDialogProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        {editingPhase && (
          <>
            <DialogHeader>
              <DialogTitle>Redigera fas</DialogTitle>
              <DialogDescription>
                Uppdatera information och tilldelningar för denna fas
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  Namn
                </Label>
                <Input
                  id="name"
                  value={editingPhase.name}
                  onChange={(e) => setEditingPhase({ ...editingPhase, name: e.target.value })}
                  className="col-span-3"
                />
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Datum</Label>
                <div className="col-span-3 flex flex-wrap md:flex-nowrap gap-3">
                  <div className="w-full md:w-1/2">
                    <Label htmlFor="startDate" className="text-xs text-muted-foreground">
                      Startdatum
                    </Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left font-normal mt-1"
                        >
                          <CalendarDays className="mr-2 h-4 w-4" />
                          {format(editingPhase.startDate, 'd MMM yyyy', { locale: sv })}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={editingPhase.startDate}
                          onSelect={(date) => date && setEditingPhase({ ...editingPhase, startDate: date })}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  
                  <div className="w-full md:w-1/2">
                    <Label htmlFor="endDate" className="text-xs text-muted-foreground">
                      Slutdatum
                    </Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left font-normal mt-1"
                        >
                          <CalendarDays className="mr-2 h-4 w-4" />
                          {format(editingPhase.endDate, 'd MMM yyyy', { locale: sv })}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={editingPhase.endDate}
                          onSelect={(date) => date && setEditingPhase({ ...editingPhase, endDate: date })}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="status" className="text-right">
                  Status
                </Label>
                <Select 
                  value={editingPhase.status}
                  onValueChange={(value) => setEditingPhase({ ...editingPhase, status: value })}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Välj status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="not started">Ej påbörjad</SelectItem>
                    <SelectItem value="in progress">Pågående</SelectItem>
                    <SelectItem value="completed">Avslutad</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="description" className="text-right">
                  Beskrivning
                </Label>
                <Textarea
                  id="description"
                  value={editingPhase.description}
                  onChange={(e) => setEditingPhase({ ...editingPhase, description: e.target.value })}
                  className="col-span-3"
                  placeholder="Beskrivning av fasen..."
                />
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="priority" className="text-right">
                  Prioritet
                </Label>
                <div className="col-span-3 space-y-2">
                  <Slider
                    id="priority"
                    min={1}
                    max={5}
                    step={1}
                    value={[editingPhase.priority]}
                    onValueChange={(value) => setEditingPhase({ ...editingPhase, priority: value[0] })}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Låg</span>
                    <span>Medel</span>
                    <span>Hög</span>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="isBlocker" className="text-right">
                  Blockerar andra faser
                </Label>
                <div className="flex items-center space-x-2 col-span-3">
                  <Switch
                    id="isBlocker"
                    checked={editingPhase.isBlocker}
                    onCheckedChange={(checked) => setEditingPhase({ ...editingPhase, isBlocker: checked })}
                  />
                  <Label htmlFor="isBlocker" className="text-sm text-muted-foreground">
                    Denna fas måste avslutas innan andra kan påbörjas
                  </Label>
                </div>
              </div>
              
              <div className="grid grid-cols-4 gap-4">
                <Label className="text-right pt-2">Resurser</Label>
                <div className="col-span-3 space-y-3">
                  {editingPhase.resources.length > 0 ? (
                    <div className="space-y-3">
                      {editingPhase.resources.map((resource, idx) => (
                        <div key={`editing-${resource.id}-${idx}`} className="flex items-center gap-3 p-3 border rounded-md">
                          <div className="flex-1">
                            <div className="font-medium">{resource.name}</div>
                          </div>
                          <div className="w-32">
                            <Label className="text-xs text-muted-foreground mb-1 block">Timmar/dag</Label>
                            <Select 
                              value={String(resource.hoursPerDay)}
                              onValueChange={(value) => handleChangeResourceHours(resource.id, Number(value))}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="1">1 timme</SelectItem>
                                <SelectItem value="2">2 timmar</SelectItem>
                                <SelectItem value="4">4 timmar</SelectItem>
                                <SelectItem value="6">6 timmar</SelectItem>
                                <SelectItem value="8">8 timmar</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <Button 
                            size="icon" 
                            variant="ghost" 
                            className="h-8 w-8" 
                            onClick={() => handleRemoveResource(resource.id)}
                          >
                            <svg 
                              width="15" 
                              height="15" 
                              viewBox="0 0 15 15" 
                              fill="none" 
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-4 w-4"
                            >
                              <path 
                                d="M12.8536 2.85355C13.0488 2.65829 13.0488 2.34171 12.8536 2.14645C12.6583 1.95118 12.3417 1.95118 12.1464 2.14645L7.5 6.79289L2.85355 2.14645C2.65829 1.95118 2.34171 1.95118 2.14645 2.14645C1.95118 2.34171 1.95118 2.65829 2.14645 2.85355L6.79289 7.5L2.14645 12.1464C1.95118 12.3417 1.95118 12.6583 2.14645 12.8536C2.34171 13.0488 2.65829 13.0488 2.85355 12.8536L7.5 8.20711L12.1464 12.8536C12.3417 13.0488 12.6583 13.0488 12.8536 12.8536C13.0488 12.6583 13.0488 12.3417 12.8536 12.1464L8.20711 7.5L12.8536 2.85355Z" 
                                fill="currentColor" 
                                fillRule="evenodd" 
                                clipRule="evenodd"
                              />
                            </svg>
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center text-muted-foreground p-4 border rounded-md">
                      Inga resurser tilldelade
                    </div>
                  )}
                  
                  <Button 
                    variant="outline" 
                    className="w-full" 
                    onClick={handleOpenResourceDialog}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Lägg till resurs
                  </Button>
                </div>
              </div>
            </div>
            
            <DialogFooter className="flex justify-between">
              <div className="flex gap-2">
                <Button variant="outline" onClick={onClose}>
                  Avbryt
                </Button>
                <Button onClick={onSave}>
                  Spara ändringar
                </Button>
              </div>
              
              {onDelete && !phase.isTemporary && (
                <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive">Ta bort fas</Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Är du säker?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Detta kommer att ta bort fasen permanent. Denna åtgärd kan inte ångras.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Avbryt</AlertDialogCancel>
                      <AlertDialogAction onClick={() => {
                        onDelete(phase.id);
                        setShowDeleteDialog(false);
                        onClose();
                      }}>
                        Ta bort
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
} 