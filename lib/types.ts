import { z } from "zod"

// Definiera en typ för ändringshistorik
export const changeHistorySchema = z.object({
  timestamp: z.string(),
  user: z.string(),
  changes: z.record(z.string()),
  comment: z.string().optional(),
})

// Lägg till dokumenttyp
export const documentSchema = z.object({
  id: z.string(),
  name: z.string(),
  size: z.number(),
  type: z.string(),
  url: z.string(),
  uploadedAt: z.string(),
  uploadedBy: z.string(),
})

export type Document = z.infer<typeof documentSchema>

export const projectSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Projektnamn krävs"),
  customer: z.string().min(1, "Kund krävs"),
  manager: z.string().min(1, "Projektledare krävs"),
  startDate: z.string().min(1, "Startdatum krävs"),
  plannedEndDate: z.string().min(1, "Planerat slutdatum krävs"),
  actualEndDate: z.string().optional(),
  status: z.enum(["Planering", "Pågående", "Färdigt", "Försenat"]),
  budget: z.number().min(0, "Budget måste vara ett positivt nummer"),
  costToDate: z.number().min(0, "Kostnad måste vara ett positivt nummer"),
  estimatedTotalCost: z.number().min(0, "Beräknad totalkostnad måste vara ett positivt nummer"), // Ny fält
  milestones: z.string(),
  comments: z.string(),
  changeHistory: z.array(changeHistorySchema).optional(),
  documents: z.array(documentSchema).optional(),
})

export const quoteSchema = z.object({
  id: z.string().optional(),
  projectName: z.string().min(1, "Projektnamn krävs"),
  customer: z.string().min(1, "Kund krävs"),
  salesperson: z.string().min(1, "Säljare krävs"),
  quoteDate: z.string().min(1, "Offertdatum krävs"),
  deadline: z.string().min(1, "Deadline krävs"),
  amount: z.number().min(0, "Belopp måste vara ett positivt nummer"),
  status: z.enum(["Skickad", "Under förhandling", "Accepterad", "Avslagen"]),
  comments: z.string(),
  followUpDate: z.string().min(1, "Uppföljningsdatum krävs"),
  changeHistory: z.array(changeHistorySchema).optional(),
  documents: z.array(documentSchema).optional(),
})

export type ChangeHistory = z.infer<typeof changeHistorySchema>
export type Project = z.infer<typeof projectSchema>
export type Quote = z.infer<typeof quoteSchema>

