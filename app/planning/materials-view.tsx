"use client"

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Search, Edit, Trash2, Package, CheckCircle2, AlertTriangle } from "lucide-react"

export function MaterialsView({ deliveries, projects }: { deliveries: any[], projects: any[] }) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  
  // Filtrerar leveranser baserat på sökfråga och statusfilter
  const filteredDeliveries = deliveries?.filter(delivery => {
    // Textfiltrering
    const matchesText = 
      delivery.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      delivery.supplier.toLowerCase().includes(searchQuery.toLowerCase()) ||
      projects?.find((p: any) => p.id === delivery.projectId)?.name.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Statusfiltrering
    const matchesStatus = statusFilter === 'all' || delivery.status === statusFilter;
    
    return matchesText && matchesStatus;
  }) || [];
  
  // Statusikonmappning för leveransstatus
  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'Levererad':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'Försenad':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default:
        return <Package className="h-4 w-4 text-blue-500" />;
    }
  };
  
  // Statusbakgrundsmappning för leveransstatus
  const getStatusClass = (status: string) => {
    switch(status) {
      case 'Levererad':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'Försenad':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      case 'Beställd':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'Planerad':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    }
  };
  
  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="flex items-center gap-2 w-full max-w-sm">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Sök leveranser..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-9"
          />
        </div>
        
        <div className="flex items-center gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filtrera på status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alla statusar</SelectItem>
              <SelectItem value="Planerad">Planerad</SelectItem>
              <SelectItem value="Beställd">Beställd</SelectItem>
              <SelectItem value="Levererad">Levererad</SelectItem>
              <SelectItem value="Försenad">Försenad</SelectItem>
            </SelectContent>
          </Select>
          
          <Button onClick={() => setIsAddDialogOpen(true)} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Ny leverans
          </Button>
        </div>
      </div>
      
      {/* Leveranstabell */}
      <div className="rounded-md border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="font-medium">Projekt</TableHead>
              <TableHead className="font-medium">Beskrivning</TableHead>
              <TableHead className="font-medium">Leverantör</TableHead>
              <TableHead className="font-medium">Datum</TableHead>
              <TableHead className="font-medium">Status</TableHead>
              <TableHead className="font-medium text-right">Kostnad</TableHead>
              <TableHead className="w-[80px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredDeliveries.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                  Inga materialleveranser hittades
                </TableCell>
              </TableRow>
            ) : (
              // Skapa demomaterial med slumpmässiga kombinationer för visning
              Array.from({ length: 5 }, (_, i) => ({
                id: `delivery-${i}`,
                description: ['Kylrör', 'Kompressor', 'Kondenseringsmaterial', 'Isoleringsmaterial', 'Styrsystem'][i],
                supplier: ['KylTech AB', 'Industrivaror Syd', 'Material Grossisten', 'Cool Systems', 'Tech Supply'][i],
                projectId: projects?.[i % projects.length]?.id || 'unknown',
                expectedDate: new Date(Date.now() + (i + 1) * 24 * 60 * 60 * 1000).toISOString(),
                status: ['Planerad', 'Beställd', 'Levererad', 'Försenad', 'Beställd'][i],
                cost: (5000 + i * 2500),
                quantity: (10 + i * 5),
                unit: ['st', 'm', 'kg', 'förp', 'set'][i]
              })).map((delivery) => (
                <TableRow key={delivery.id} className="hover:bg-muted/40">
                  <TableCell>
                    {projects?.find((p: any) => p.id === delivery.projectId)?.name || 'Okänt projekt'}
                  </TableCell>
                  <TableCell>{delivery.description}</TableCell>
                  <TableCell>{delivery.supplier}</TableCell>
                  <TableCell>{new Date(delivery.expectedDate).toLocaleDateString('sv-SE')}</TableCell>
                  <TableCell>
                    <div className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusClass(delivery.status)}`}>
                      {getStatusIcon(delivery.status)}
                      {delivery.status}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">{delivery.cost.toLocaleString('sv-SE')} kr</TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Edit className="h-4 w-4" />
                        <span className="sr-only">Redigera</span>
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Trash2 className="h-4 w-4 text-destructive" />
                        <span className="sr-only">Ta bort</span>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      
      {/* Dialog för att lägga till ny leverans */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Lägg till ny materialleverans</DialogTitle>
            <DialogDescription>
              Fyll i informationen för att planera en ny materialleverans.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="project" className="text-right">Projekt</Label>
              <Select>
                <SelectTrigger id="project" className="col-span-3">
                  <SelectValue placeholder="Välj projekt" />
                </SelectTrigger>
                <SelectContent>
                  {projects?.map((project: any) => (
                    <SelectItem key={project.id} value={project.id}>{project.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right">Beskrivning</Label>
              <Input id="description" className="col-span-3" placeholder="Kylrör, Kompressor, etc." />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="supplier" className="text-right">Leverantör</Label>
              <Input id="supplier" className="col-span-3" placeholder="KylTech AB" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="quantity" className="text-right">Antal</Label>
              <Input id="quantity" type="number" className="w-20" placeholder="10" />
              <Input id="unit" className="w-20" placeholder="st" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="cost" className="text-right">Kostnad</Label>
              <Input id="cost" type="number" className="col-span-3" placeholder="5000" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="date" className="text-right">Leveransdatum</Label>
              <Input id="date" type="date" className="col-span-3" />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit">Lägg till</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <div className="text-sm text-muted-foreground">
        <p className="italic">Detta är en platshållare för materialleveranser. I framtida versioner kommer en fullständig leveranshantering implementeras med möjlighet att spåra, notifiera och integrera med leverantörssystem.</p>
      </div>
    </div>
  )
} 